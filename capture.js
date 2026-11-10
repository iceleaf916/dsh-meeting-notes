/**
 * macOS 录音能力封装：编译并驱动 Swift 辅助程序（ScreenCaptureKit 系统音频 +
 * AVAudioEngine 麦克风，混音后输出 16kHz mono s16le 裸 PCM）。
 *
 * 平台抽象：`platformInfo()` / `ensureRecorder()` / `startRecorder()` 是 Host 侧
 * 唯一与平台相关的入口。将来支持 Linux/Windows 时新增同签名实现即可，其余模块
 * （asr.js / index.js）不需要改。
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PLUGIN_DIR = path.dirname(fileURLToPath(import.meta.url));
const RECORDER_DIR = path.join(PLUGIN_DIR, 'recorder');
const BUILD_DIR = path.join(RECORDER_DIR, '.build');
const BINARY = path.join(BUILD_DIR, 'meeting-recorder');
const SOURCE = path.join(RECORDER_DIR, 'main.swift');
const BUILD_SCRIPT = path.join(RECORDER_DIR, 'build.sh');

const BUILD_TIMEOUT_MS = 180000;
const STOP_GRACE_MS = 8000;

export function platformInfo() {
  const supported = process.platform === 'darwin';
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : process.arch;
  return {
    supported,
    platform: process.platform,
    arch,
    name: supported ? `macOS (${arch})` : `${process.platform} (${arch})`,
    reason: supported ? '' : '当前插件仅支持 macOS 录音，Linux / Windows 采集后端尚未实现',
  };
}

async function statOrNull(file) {
  try {
    return await fs.stat(file);
  } catch {
    return null;
  }
}

export async function recorderState() {
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

/** 编译 Swift 辅助程序（首次使用或源码更新后）。并发调用合并为一次构建。 */
export async function ensureRecorder() {
  if (!platformInfo().supported) throw new Error(platformInfo().reason);
  const state = await recorderState();
  if (state.built) return state;
  if (!state.sourceExists) throw new Error('录音辅助程序源码缺失，请重新安装插件');
  if (building) return building;

  building = (async () => {
    await fs.mkdir(BUILD_DIR, { recursive: true });
    const output = [];
    const child = spawn('/bin/bash', [BUILD_SCRIPT, BINARY], {
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
      throw new Error(`录音辅助程序编译失败（退出码 ${code}）：\n${tail}`);
    }
    const after = await recorderState();
    if (!after.built) throw new Error('录音辅助程序编译完成但产物不存在');
    return after;
  })().finally(() => {
    building = null;
  });
  return building;
}

/**
 * 启动录音进程。
 * @returns {{ stop: () => Promise<void>, kill: () => void, ready: Promise<void>, pid?: number }}
 */
export function startRecorder({ captureSystemAudio = true, captureMicrophone = true, onPcm, onSignal, onExit }) {
  if (!platformInfo().supported) throw new Error(platformInfo().reason);
  const args = [
    '--sample-rate',
    '16000',
    '--system',
    captureSystemAudio ? '1' : '0',
    '--mic',
    captureMicrophone ? '1' : '0',
  ];
  const child = spawn(BINARY, args, { stdio: ['pipe', 'pipe', 'pipe'] });

  let stderrBuffer = '';
  let settledReady = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  child.stdout.on('data', (chunk) => {
    try {
      onPcm?.(chunk);
    } catch (error) {
      onSignal?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
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
        onSignal?.({ type: 'log', message: line });
        continue;
      }
      if (signal.type === 'ready') {
        settledReady = true;
        resolveReady();
      } else if (signal.type === 'error') {
        if (!settledReady) {
          settledReady = true;
          rejectReady(new Error(signal.message || '录音启动失败'));
        }
        onSignal?.(signal);
      } else {
        onSignal?.(signal);
      }
    }
  });

  let exited = false;
  const exitPromise = new Promise((resolve) => {
    child.once('exit', (code, signal) => {
      exited = true;
      if (!settledReady) {
        settledReady = true;
        const tail = stderrBuffer.trim();
        rejectReady(new Error(`录音进程意外退出（code=${code} signal=${signal}）${tail ? `：${tail}` : ''}`));
      }
      onExit?.({ code, signal });
      resolve({ code, signal });
    });
  });

  child.once('error', (error) => {
    if (!settledReady) {
      settledReady = true;
      rejectReady(error);
    }
  });

  const kill = () => {
    try {
      child.kill('SIGKILL');
    } catch {
      /* ignore */
    }
  };

  const stop = async () => {
    if (exited) return { code: 0, signal: null };
    try {
      child.stdin.write('{"cmd":"stop"}\n');
    } catch {
      /* stdin may already be closed */
    }
    const timer = setTimeout(() => {
      kill();
    }, STOP_GRACE_MS);
    const result = await exitPromise;
    clearTimeout(timer);
    return result;
  };

  return { child, stop, kill, ready, pid: child.pid };
}
