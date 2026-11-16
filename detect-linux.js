/**
 * Linux 会议检测实现：枚举进程 + 查询 PulseAudio / PipeWire 音频流。
 *
 * 与 macOS 检测器（recorder/detector.swift）保持同一份采样契约：
 *   sample = { type: 'sample', at, apps: [{ bundle, executable, input, output }] }
 * 但 Linux 上没有辅助二进制，采样直接在 Host 进程内完成：
 *   - 进程：`ps -eo pid=,comm=`，匹配 wemeet / wwemapp 等进程名；
 *   - 音频：`pactl` 查询 sink-inputs / source-outputs / sinks，腾讯会议在会中
 *     会挂着自己的音频流（Wemeet VoiceEngine），即使静音也会保留流对象。
 *
 * 判定口径和参考实现 wemeet-meeting 的 MeetingProbe 一致：只有相关进程在跑，
 * 才继续看音频流；这样不会把残留的音频节点误判成会议。
 */

import { execFile } from 'node:child_process';
import { accessSync, constants } from 'node:fs';
import { readlink } from 'node:fs/promises';

const DEFAULT_INTERVAL_MS = 500;
const MIN_INTERVAL_MS = 100;
const MAX_INTERVAL_MS = 60000;
const COMMAND_TIMEOUT_MS = 3000;
const MAX_SAMPLE_FAILURES = 3;

const PROCESS_NAMES = {
  tencent: ['wemeet', 'wemeetapp'],
  wecom: ['wwmapp', 'wxwork', 'wxworkapp', 'wecom'],
};

const TEXT_HINTS = {
  tencent: ['wemeet', 'tencent meeting', '腾讯会议'],
  wecom: ['wwmapp', '企业微信', 'wecom', 'wxwork'],
};

function normalizeInterval(intervalMs) {
  const value = Number(intervalMs);
  if (!Number.isFinite(value)) return DEFAULT_INTERVAL_MS;
  return Math.min(MAX_INTERVAL_MS, Math.max(MIN_INTERVAL_MS, Math.round(value)));
}

function run(command, args, env = process.env) {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      { timeout: COMMAND_TIMEOUT_MS, maxBuffer: 8 * 1024 * 1024, encoding: 'utf8', env },
      (error, stdout, stderr) => resolve({ error, stdout: stdout || '', stderr: stderr || '' }),
    );
  });
}

/** 从 PATH 里找 pactl；找不到时检测只能退化为进程枚举，不可用。 */
function findCommand(name, env = process.env) {
  const dirs = String(env.PATH || '').split(':').filter(Boolean);
  for (const dir of dirs) {
    const candidate = `${dir.replace(/\/+$/, '')}/${name}`;
    try {
      // 同步探测，和 capture-linux.js 的做法一致；这里只用于给 UI 一个明确状态。
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      /* try next */
    }
  }
  return null;
}

function appKeyForName(comm, exe) {
  // 只认同名的进程/可执行文件：WeCom 自带的 wemeet.dll 之类不能被当成腾讯会议。
  const candidates = [String(comm || '').toLowerCase()];
  const base = String(exe || '').split('/').pop();
  if (base) candidates.push(base.toLowerCase());
  for (const [key, names] of Object.entries(PROCESS_NAMES)) {
    if (candidates.some((name) => name && names.includes(name))) return key;
  }
  return null;
}

function appKeyForText(text) {
  const haystack = String(text || '').toLowerCase();
  for (const [key, hints] of Object.entries(TEXT_HINTS)) {
    if (hints.some((hint) => haystack.includes(hint))) return key;
  }
  return null;
}

async function listProcesses(env) {
  const result = await run('ps', ['-eo', 'pid=,comm='], env);
  if (result.error) {
    throw new Error(`无法枚举系统进程：${result.error.message}`);
  }
  const out = [];
  for (const line of result.stdout.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = /^(\d+)\s+(.+)$/.exec(trimmed);
    if (!match) continue;
    const pid = Number(match[1]);
    const comm = match[2].trim();
    const key = appKeyForName(comm, '');
    if (!key) continue;
    let exe = '';
    try {
      exe = await readlink(`/proc/${pid}/exe`);
    } catch {
      /* 进程可能在枚举后退出，忽略 */
    }
    out.push({ key, pid, comm, executable: exe || comm });
  }
  return out;
}

function haystackOfStream(stream) {
  const props = stream && typeof stream === 'object' && stream.properties ? stream.properties : {};
  const values = [
    stream?.name,
    stream?.description,
    props['media.name'],
    props['application.name'],
    props['application.process.binary'],
    props['node.name'],
  ];
  return values.filter((value) => typeof value === 'string' && value).join(' ');
}

async function listPulseObjects(kind, env) {
  // PA 15+ / PipeWire 支持 JSON 输出；失败时退回文本解析（老版本 PulseAudio）。
  const result = await run('pactl', ['-f', 'json', 'list', kind], env);
  if (!result.error) {
    try {
      const parsed = JSON.parse(result.stdout);
      if (Array.isArray(parsed)) return parsed.map((stream) => haystackOfStream(stream));
    } catch {
      /* 落到文本解析 */
    }
  }
  const fallback = await run('pactl', ['list', kind], env);
  if (fallback.error) return null;
  const haystacks = [];
  let current = [];
  const flush = () => {
    if (current.length) haystacks.push(current.join(' '));
    current = [];
  };
  for (const line of fallback.stdout.split('\n')) {
    if (/^(Sink Input|Source Output|Sink|Source) #\d+/.test(line)) {
      flush();
      current.push(line);
      continue;
    }
    const match = /^\s*(Name|Description|media\.name|application\.name|application\.process\.binary|node\.name)\s*=\s*"?([^"]*)"?/.exec(
      line,
    );
    if (match) current.push(match[2]);
  }
  flush();
  return haystacks;
}

async function scanPulse(env) {
  const [sinkInputs, sourceOutputs, sinks] = await Promise.all([
    listPulseObjects('sink-inputs', env),
    listPulseObjects('source-outputs', env),
    listPulseObjects('sinks', env),
  ]);
  if (!sinkInputs && !sourceOutputs) {
    throw new Error('无法读取 PulseAudio 音频流，请确认 pipewire-pulse / pulseaudio 正在运行');
  }
  return {
    sinkInputs: sinkInputs || [],
    sourceOutputs: sourceOutputs || [],
    sinks: sinks || [],
  };
}

function collectMatches(list, key) {
  return list.some((text) => appKeyForText(text) === key);
}

async function sampleOnce(env) {
  const [processes, pulse] = await Promise.all([listProcesses(env), scanPulse(env)]);
  const dedicatedTencentSink = pulse.sinks.some((text) => /wemeet|we meet/i.test(text));
  const apps = [];
  for (const key of Object.keys(PROCESS_NAMES)) {
    const running = processes.filter((item) => item.key === key);
    if (!running.length) continue;
    const output =
      collectMatches(pulse.sinkInputs, key) || (key === 'tencent' && dedicatedTencentSink);
    const input = collectMatches(pulse.sourceOutputs, key);
    apps.push({
      bundle: key === 'tencent' ? 'com.tencent.meeting' : 'com.tencent.wwmapp',
      executable: running[0].executable,
      input,
      output,
    });
  }
  return { at: Date.now(), apps };
}

/** 检测能力状态：Linux 上不需要编译，只要有 pactl 即可。 */
export async function linuxDetectorState() {
  const pactl = findCommand('pactl');
  return {
    built: Boolean(pactl),
    stale: false,
    binaryPath: pactl || '',
    sourcePath: '',
    sourceExists: true,
  };
}

export async function ensureLinuxDetector() {
  if (!findCommand('pactl')) {
    throw new Error('缺少 pactl（pulseaudio-utils），Linux 会议检测需要它读取音频流；请安装后重启 DSH');
  }
  return linuxDetectorState();
}

/**
 * 启动 Linux 检测采样。返回结构与 detector.js 的 macOS 实现一致，便于上层复用。
 */
export function startLinuxDetector({
  intervalMs = DEFAULT_INTERVAL_MS,
  targets = [],
  onReady,
  onSample,
  onError,
  onExit,
} = {}) {
  const info = findCommand('pactl');
  if (!info) throw new Error('缺少 pactl（pulseaudio-utils），Linux 会议检测需要它读取音频流');

  const wanted = new Set(
    (Array.isArray(targets) ? targets : []).map((item) => String(item || '').trim()).filter(Boolean),
  );
  const allowed = (bundle) => {
    if (!wanted.size) return true;
    for (const prefix of wanted) if (bundle === prefix || bundle.startsWith(`${prefix}.`)) return true;
    return false;
  };

  const period = normalizeInterval(intervalMs);
  const child = {
    stdin: { on() {}, write() { return true; } },
    stdout: { on() {} },
    stderr: { on() {} },
    pid: undefined,
    kill: () => stop(),
  };

  let timer = null;
  let stopped = false;
  let sampling = null;
  let failures = 0;
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  const stop = (() => {
    let promise = null;
    return () => {
      if (promise) return promise;
      stopped = true;
      promise = (async () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        try {
          await sampling;
        } catch {
          /* ignore */
        }
        return { code: 0, signal: null };
      })();
      return promise;
    };
  })();

  const tick = async () => {
    if (stopped || sampling) return;
    if (!timer) return;
    sampling = (async () => {
      try {
        const sample = await sampleOnce(process.env);
        failures = 0;
        if (stopped) return;
        const apps = sample.apps.filter((item) => allowed(item.bundle));
        onSample?.({ type: 'sample', at: sample.at, apps });
      } catch (error) {
        failures += 1;
        if (failures >= MAX_SAMPLE_FAILURES && !stopped) {
          const message = error instanceof Error ? error.message : String(error);
          onError?.(message);
        }
      } finally {
        sampling = null;
      }
    })();
    await sampling;
  };

  timer = setInterval(tick, period);
  timer.unref?.();
  onReady?.({ type: 'ready', intervalMs: period });
  resolveReady();
  // 立即采一次，UI 不用等半个周期才拿到首个样本。
  void tick();

  return { child, ready, stop, kill: () => stop(), pid: undefined, onExit: undefined };
}

export { DEFAULT_INTERVAL_MS };
