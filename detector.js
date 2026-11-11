/**
 * macOS 会议检测能力封装：编译并驱动 Swift 常驻检测程序（CoreAudio 进程对象 +
 * CGWindowList 窗口存在性），供 detect.js 的状态机消费。
 *
 * 平台抽象：`detectorState()` / `ensureDetector()` / `startDetector()` 是 Host 侧
 * 唯一与检测器进程相关的入口，与 capture.js 的 recorder 三件套同构：
 *   - stderr 是 JSON lines（ready / sample / error），stdout 保持为空；
 *   - stop 先写 {"cmd":"stop"}（优雅），2s 后 SIGTERM，再 2s SIGKILL。
 *
 * 检测器只做采样、不做状态判定；「是否真的在会中」的去抖/宽限期/冷却在 detect.js。
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const RECORDER_DIR = path.join(PLUGIN_DIR, 'recorder');
const BUILD_DIR = path.join(RECORDER_DIR, '.build');
const BINARY = path.join(BUILD_DIR, 'meeting-detector');
const SOURCE = path.join(RECORDER_DIR, 'detector.swift');
const BUILD_SCRIPT = path.join(RECORDER_DIR, 'build.sh');

const BUILD_TIMEOUT_MS = 180000;
const STOP_TERMINATE_GRACE_MS = 2000;
const STOP_KILL_GRACE_MS = 2000;
const DEFAULT_INTERVAL_MS = 500;
const MIN_INTERVAL_MS = 100;
const MAX_INTERVAL_MS = 60000;

const PLATFORM_REASON = '当前插件仅支持 macOS 会议检测（需要 macOS 14.2+）';

async function statOrNull(file) {
  try {
    return await fs.stat(file);
  } catch {
    return null;
  }
}

/** 检测器二进制与源码的构建状态（与 capture.js 的 recorderState 同构）。 */
export async function detectorState() {
  const binary = await statOrNull(BINARY);
  const source = await statOrNull(SOURCE);
  const stale = Boolean(binary && source && source.mtimeMs > binary.mtimeMs);
  return {
    built: Boolean(binary) && !stale,
    stale,
    binaryPath: BINARY,
    sourcePath: SOURCE,
    sourceExists: Boolean(source),
  };
}

let building = null;

/** 编译检测器（首次使用或源码更新后）。并发调用合并为一次构建。 */
export async function ensureDetector() {
  if (process.platform !== 'darwin') throw new Error(PLATFORM_REASON);
  const state = await detectorState();
  if (state.built) return state;
  if (!state.sourceExists) throw new Error('会议检测辅助程序源码缺失，请重新安装插件');
  if (building) return building;

  building = (async () => {
    await fs.mkdir(BUILD_DIR, { recursive: true });
    const output = [];
    const child = spawn('/bin/bash', [BUILD_SCRIPT, BINARY, SOURCE], {
      cwd: RECORDER_DIR,
      env: { ...process.env, CLANG_MODULE_CACHE_PATH: path.join(BUILD_DIR, 'module-cache') },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const collect = (chunk) => {
      output.push(chunk.toString());
      if (output.join('').length > 20000) output.splice(0, output.length - 20);
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }, BUILD_TIMEOUT_MS);

    const code = await new Promise((resolve) => {
      child.once('error', (error) => {
        output.push(`spawn error: ${error.message}`);
        resolve(-1);
      });
      child.once('exit', (exitCode) => resolve(exitCode ?? -1));
    });
    clearTimeout(timer);

    if (code !== 0) {
      const tail = output.join('').trim().split('\n').slice(-12).join('\n');
      throw new Error(`会议检测辅助程序编译失败（退出码 ${code}）：\n${tail}`);
    }
    const after = await detectorState();
    if (!after.built) throw new Error('会议检测辅助程序编译完成但产物不存在');
    return after;
  })().finally(() => {
    building = null;
  });
  return building;
}

function callSafely(callback, ...args) {
  if (typeof callback !== 'function') return;
  try {
    callback(...args);
  } catch (error) {
    // 消费方的回调异常不能打断 stderr 解析，更不能拖垮 Host。
    console.warn('[meeting-detector] 回调异常：', error);
  }
}

function normalizeInterval(intervalMs) {
  const value = Number(intervalMs);
  if (!Number.isFinite(value)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, Math.round(value)));
}

function normalizeTargets(targets) {
  if (!Array.isArray(targets)) return [];
  const out = [];
  const seen = new Set();
  for (const item of targets) {
    const value = String(item ?? '').trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * 启动检测进程。
 * @param {{
 *   intervalMs?: number,
 *   targets?: string[],
 *   onReady?: (signal: object) => void,
 *   onSample?: (sample: object) => void,
 *   onError?: (message: string, signal?: object) => void,
 *   onExit?: (info: { code: number|null, signal: string|null }) => void,
 * }} options
 * @returns {{ child: import('node:child_process').ChildProcess, ready: Promise<void>,
 *   stop: () => Promise<{ code: number|null, signal: string|null }>, kill: () => void, pid?: number }}
 */
export function startDetector({
  intervalMs = DEFAULT_INTERVAL_MS,
  targets = [],
  onReady,
  onSample,
  onError,
  onExit,
} = {}) {
  if (process.platform !== 'darwin') throw new Error(PLATFORM_REASON);

  const args = ['--interval-ms', String(normalizeInterval(intervalMs))];
  for (const target of normalizeTargets(targets)) args.push('--bundle', target);

  const child = spawn(BINARY, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  // stdout 契约上永远为空；仍然消费掉，避免管道写满把检测器阻塞。
  child.stdout.on('data', () => {});
  // 进程已退出后 stop() 仍可能写 stdin（EPIPE），这里吞掉，避免 unhandled 'error'。
  child.stdin.on('error', () => {});

  let stderrBuffer = '';
  let settledReady = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  child.stderr.on('data', (chunk) => {
    stderrBuffer += chunk.toString('utf8');
    let index = stderrBuffer.indexOf('\n');
    while (index >= 0) {
      const line = stderrBuffer.slice(0, index).trim();
      stderrBuffer = stderrBuffer.slice(index + 1);
      index = stderrBuffer.indexOf('\n');
      if (!line) continue;
      let signal;
      try {
        signal = JSON.parse(line);
      } catch {
        // 非 JSON 行（编译器/系统诊断）：只记录，不进 Host 的错误态。
        console.warn(`[meeting-detector] ${line}`);
        continue;
      }
      if (!signal || typeof signal !== 'object') continue;
      if (signal.type === 'ready') {
        if (!settledReady) {
          settledReady = true;
          resolveReady();
        }
        callSafely(onReady, signal);
      } else if (signal.type === 'sample') {
        callSafely(onSample, signal);
      } else if (signal.type === 'error') {
        const message = String(signal.message || '会议检测启动失败');
        if (!settledReady) {
          settledReady = true;
          rejectReady(new Error(message));
        }
        callSafely(onError, message, signal);
      } else {
        callSafely(onError, `未知的检测器事件：${line}`);
      }
    }
  });

  let exited = false;
  let exitResult = null;
  let timers = [];
  const clearTimers = () => {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  };

  const exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      exited = true;
      exitResult = { code, signal };
      clearTimers();
      if (!settledReady) {
        settledReady = true;
        const tail = stderrBuffer.trim();
        rejectReady(
          new Error(`会议检测进程意外退出（code=${code} signal=${signal}）${tail ? `：${tail}` : ''}`),
        );
      }
      callSafely(onExit, exitResult);
      resolve(exitResult);
    });
  });

  child.once('error', (error) => {
    if (!settledReady) {
      settledReady = true;
      rejectReady(error);
    }
  });

  const kill = () => {
    clearTimers();
    try {
      child.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  };

  let stopping = null;
  const stop = () => {
    if (stopping) return stopping;
    stopping = (async () => {
      if (exited) return exitResult ?? { code: 0, signal: null };
      try {
        child.stdin.write('{"cmd":"stop"}\n');
      } catch {
        /* stdin may already be closed */
      }
      // 先礼后兵：2s 内没退出就 SIGTERM，再 2s 还没退就 SIGKILL。
      timers.push(
        setTimeout(() => {
          try {
            child.kill('SIGTERM');
          } catch {
            /* ignore */
          }
          timers.push(
            setTimeout(() => {
              try {
                child.kill('SIGKILL');
              } catch {
                /* ignore */
              }
            }, STOP_KILL_GRACE_MS),
          );
        }, STOP_TERMINATE_GRACE_MS),
      );
      return await exitPromise;
    })();
    return stopping;
  };

  return { child, ready, stop, kill, pid: child.pid };
}
