/**
 * Linux 录音后端：用两个 `parec` 子进程分别采集「系统声音的 monitor 源」与
 * 「麦克风」，在 Node 里按到达时间对齐后逐样本混音，输出与 macOS 后端一致的
 * 16kHz mono s16le 裸 PCM / JSON 电平事件。
 *
 * 为什么不用原生扩展：
 *   - PipeWire / PulseAudio 的 `parec` 已经能稳定给出低延迟的 s16le 流；
 *   - 混音只是 int16 相加 clamp，放在 Node 里足够快（每秒 3.2 万样本）；
 *   - 免去 libpulse 头文件与 node-gyp 编译，npm 装包即可用。
 *
 * 设备选择：
 *   - 系统声音 = 默认 sink 的 `<sink>.monitor`（也可用 DSH_MEETING_SYSTEM_SOURCE 指定）；
 *   - 麦克风 = 默认 source（也可用 DSH_MEETING_MIC_SOURCE 指定）。
 *   pipewire-pulse 对不存在的设备名会一直阻塞而不是报错，所以启动前先
 *   `pactl list short sources` 校验设备名。
 */

import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';

const SAMPLE_RATE = 16000;
const TICK_MS = 20;
const TICK_SAMPLES = (SAMPLE_RATE * TICK_MS) / 1000;
const LEVEL_EVERY_TICKS = 5;
const READY_TIMEOUT_MS = 5000;
const STOP_TERMINATE_GRACE_MS = 2000;
const MAX_BACKLOG_SEC = 1;

function findExecutable(name, env = process.env) {
  const dirs = String(env.PATH || '').split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const file = path.join(dir, name);
    try {
      fs.accessSync(file, fs.constants.X_OK);
      return file;
    } catch {
      /* keep looking */
    }
  }
  return '';
}

/** Linux 侧实际用到的外部命令。检测进程名/格式时也复用这里的定位逻辑。 */
export function linuxTools(env = process.env) {
  const parec = findExecutable('parec', env);
  const pactl = findExecutable('pactl', env);
  return { parec, pactl, ok: Boolean(parec && pactl) };
}

export function linuxPlatformInfo() {
  const arch = process.arch === 'arm64' ? 'arm64' : process.arch === 'x64' ? 'x64' : process.arch;
  const tools = linuxTools();
  const supported = tools.ok;
  return {
    supported,
    platform: 'linux',
    arch,
    name: `Linux (${arch})`,
    reason: supported
      ? ''
      : 'Linux 录音需要 PipeWire/PulseAudio 的 parec 与 pactl（安装 pulseaudio-utils，或使用带 pipewire-pulse 的桌面环境）',
  };
}

export async function linuxRecorderState() {
  const tools = linuxTools();
  return {
    built: tools.ok,
    stale: false,
    binaryPath: tools.parec,
    sourcePath: '',
    sourceExists: tools.ok,
  };
}

export async function ensureLinuxRecorder() {
  const info = linuxPlatformInfo();
  if (!info.supported) throw new Error(info.reason);
  return linuxRecorderState();
}

function runTool(bin, args, timeoutMs = 3000) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(bin, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ code: -1, stdout: '', stderr: error instanceof Error ? error.message : String(error) });
      return;
    }
    let stdout = '';
    let stderr = '';
    let settled = false;
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }, timeoutMs);
    const finish = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    };
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8');
    });
    child.once('error', (error) => {
      stderr += error instanceof Error ? error.message : String(error);
      finish(-1);
    });
    child.once('close', (code) => finish(code ?? -1));
  });
}

/** 解析 `pactl list short sources|sinks`：index \t name \t driver \t spec \t state。 */
export function parsePactlShortList(text) {
  const out = [];
  for (const raw of String(text || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const columns = line.split('\t').map((item) => item.trim());
    const name = columns.length > 1 ? columns[1] : (line.split(/\s+/)[1] || '');
    if (!name) continue;
    out.push({ index: Number(columns[0]) || 0, name, state: columns[4] || '' });
  }
  return out;
}

function pickDefaultMonitor(sources, defaultSink) {
  if (defaultSink) {
    const preferred = sources.find((source) => source.name === `${defaultSink}.monitor`);
    if (preferred) return preferred.name;
  }
  const monitors = sources.filter((source) => source.name.endsWith('.monitor'));
  const preferred = monitors.find((source) => !source.name.startsWith('null-sink'));
  return (preferred || monitors[0])?.name || '';
}

function pickDefaultMicrophone(sources, defaultSource) {
  if (defaultSource && !defaultSource.endsWith('.monitor')) {
    const preferred = sources.find((source) => source.name === defaultSource);
    if (preferred) return preferred.name;
  }
  return sources.find((source) => !source.name.endsWith('.monitor'))?.name || '';
}

/**
 * 解析本次录音要用的两个设备名。纯函数（外部命令可注入），便于测试。
 * @returns {Promise<{system: string, mic: string, sources: {name: string}[]}>}
 */
export async function resolveCaptureSources({
  captureSystemAudio = true,
  captureMicrophone = true,
  env = process.env,
  tools = linuxTools(env),
  run = runTool,
} = {}) {
  if (!tools.pactl) throw new Error('找不到 pactl，无法枚举 PipeWire/PulseAudio 设备（安装 pulseaudio-utils）');
  const listed = await run(tools.pactl, ['list', 'short', 'sources']);
  if (listed.code !== 0) {
    throw new Error(`无法读取音频设备列表：${listed.stderr.trim() || `pactl 退出码 ${listed.code}`}`);
  }
  const sources = parsePactlShortList(listed.stdout);
  if (!sources.length) throw new Error('没有找到任何音频输入源，请确认 PipeWire/PulseAudio 正在运行');

  const names = new Set(sources.map((source) => source.name));
  const defaultSink = (await run(tools.pactl, ['get-default-sink'])).stdout.trim();
  const defaultSource = (await run(tools.pactl, ['get-default-source'])).stdout.trim();

  let system = '';
  if (captureSystemAudio) {
    const override = String(env.DSH_MEETING_SYSTEM_SOURCE || '').trim();
    system = override || pickDefaultMonitor(sources, defaultSink);
    if (!system) {
      throw new Error('没有找到系统声音的 monitor 源；请在设置里关闭系统声音，或确认默认扬声器已启用');
    }
    if (!names.has(system)) {
      throw new Error(`系统声音源「${system}」不存在，可用源：${[...names].join(', ')}`);
    }
  }

  let mic = '';
  if (captureMicrophone) {
    const override = String(env.DSH_MEETING_MIC_SOURCE || '').trim();
    mic = override || pickDefaultMicrophone(sources, defaultSource);
    if (!mic) throw new Error('没有找到麦克风；请在设置里关闭麦克风，或接入一个输入设备');
    if (!names.has(mic)) {
      throw new Error(`麦克风「${mic}」不存在，可用源：${[...names].join(', ')}`);
    }
    if (mic === system) throw new Error('系统声音与麦克风解析到了同一个音频源，请检查默认设备设置');
  }

  return { system, mic, sources };
}

/**
 * 双路 PCM 混音器。按「首块数据的到达时间 - 该块时长」估算每路音频的起始时刻，
 * 把晚开始的一路补静音对齐，再逐样本相加并 clamp 到 int16。
 *
 * `tick(now)` 与 `push(role, chunk, now)` 的时间都可注入，测试里可以手动拨钟。
 */
export class PcmMixer {
  constructor({ sampleRate = SAMPLE_RATE, onPcm, onLevel, now = () => Date.now() } = {}) {
    this.sampleRate = sampleRate;
    this.onPcm = onPcm;
    this.onLevel = onLevel;
    this.now = now;
    this.sources = new Map();
    this.origin = null;
    this.emitted = 0;
    this.tickCount = 0;
    this.levels = new Map();
  }

  addSource(role) {
    const source = {
      role,
      chunks: [],
      carry: Buffer.alloc(0),
      delivered: 0,
      consumed: 0,
      offset: null,
      contentStart: null,
      firstAt: null,
    };
    this.sources.set(role, source);
    this.levels.set(role, { sumSquares: 0, count: 0 });
    return source;
  }

  source(role) {
    return this.sources.get(role) || null;
  }

  push(role, chunk) {
    const source = this.sources.get(role);
    if (!source || !chunk || !chunk.length) return;
    let data = chunk;
    if (source.carry.length) {
      data = Buffer.concat([source.carry, data]);
      source.carry = Buffer.alloc(0);
    }
    if (data.length % 2) {
      source.carry = Buffer.from(data.subarray(data.length - 1));
      data = data.subarray(0, data.length - 1);
    }
    if (!data.length) return;

    const at = this.now();
    if (source.firstAt === null) {
      source.firstAt = at;
      const durationMs = ((data.length >> 1) * 1000) / this.sampleRate;
      source.contentStart = at - durationMs;
      if (this.origin === null || source.contentStart < this.origin) {
        this.origin = source.contentStart;
      }
      // 每次有流给出首块时间，都重算所有已知流的偏移，保持相对对齐。
      for (const item of this.sources.values()) {
        if (item.contentStart === null) continue;
        item.offset = Math.max(
          0,
          Math.round(((item.contentStart - this.origin) * this.sampleRate) / 1000),
        );
      }
    }
    source.chunks.push(data);
    source.delivered += data.length >> 1;
  }

  /** 从队首取最多 count 个样本（s16le Buffer），不足时返回较短 buffer。 */
  takeSamples(source, count) {
    let needBytes = count * 2;
    const parts = [];
    let takenBytes = 0;
    while (needBytes > 0 && source.chunks.length) {
      const head = source.chunks[0];
      if (head.length <= needBytes) {
        parts.push(head);
        needBytes -= head.length;
        takenBytes += head.length;
        source.chunks.shift();
      } else {
        parts.push(head.subarray(0, needBytes));
        source.chunks[0] = head.subarray(needBytes);
        takenBytes += needBytes;
        needBytes = 0;
      }
    }
    source.consumed += takenBytes >> 1;
    if (!parts.length) return Buffer.alloc(0);
    return parts.length === 1 ? parts[0] : Buffer.concat(parts);
  }

  discard(source, samples) {
    this.takeSamples(source, samples);
  }

  tick(now = this.now()) {
    if (this.origin === null) return;
    const target = Math.floor(((now - this.origin) * this.sampleRate) / 1000);
    const frames = target - this.emitted;
    if (frames <= 0) return;

    const out = Buffer.alloc(frames * 2);
    const maxBacklog = MAX_BACKLOG_SEC * this.sampleRate;
    const frameDurationMs = (frames * 1000) / this.sampleRate;

    for (const source of this.sources.values()) {
      const offset = source.offset === null ? 0 : source.offset;
      // 晚到的流：落在已输出区间里的样本直接丢掉，保证它从当前时间点开始混音。
      const nextAbs = offset + source.consumed;
      if (nextAbs < this.emitted) {
        const drop = Math.min(source.delivered - source.consumed, this.emitted - nextAbs);
        if (drop > 0) this.discard(source, drop);
      }
      const wanted = Math.max(0, target - offset);
      const available = source.delivered - source.consumed;
      const need = Math.max(0, wanted - source.consumed);
      if (available - need > maxBacklog) this.discard(source, available - need - maxBacklog);
      // 这一块样本在输出时间轴上的起点：源内偏移 + 已消费样本 - 已输出样本。
      const start = offset + source.consumed - this.emitted;
      const take = Math.min(need, Math.max(0, source.delivered - source.consumed), frames);
      const pcm = take > 0 ? this.takeSamples(source, take) : Buffer.alloc(0);

      const level = this.levels.get(source.role) || { sumSquares: 0, count: 0 };
      for (let index = 0; index < pcm.length >> 1; index += 1) {
        const value = pcm.readInt16LE(index * 2);
        level.sumSquares += value * value;
        const pos = start + index;
        if (pos < 0 || pos >= frames) continue;
        const mixed = out.readInt16LE(pos * 2) + value;
        out.writeInt16LE(Math.max(-32768, Math.min(32767, mixed)), pos * 2);
      }
      // 电平以「这一 tick 的时长」为分母，这样静音时电平会自然掉到 0。
      level.count += Math.round((frameDurationMs * this.sampleRate) / 1000);
      this.levels.set(source.role, level);
    }

    this.emitted = target;
    this.onPcm?.(out);
    this.tickCount += 1;
    if (this.tickCount % LEVEL_EVERY_TICKS === 0 && this.onLevel) this.emitLevel();
  }

  emitLevel() {
    const read = (role) => {
      const level = this.levels.get(role);
      if (!level || !level.count) return 0;
      const value = Math.sqrt(level.sumSquares / level.count) / 32768;
      level.sumSquares = 0;
      level.count = 0;
      if (!Number.isFinite(value)) return 0;
      return Math.round(Math.min(1, Math.max(0, value)) * 10000) / 10000;
    };
    const system = read('system');
    const mic = read('mic');
    // 与 macOS 后端一致：合并 RMS 按参与混音的路数取均方根。
    const count = Math.max(1, this.sources.size);
    const combined = Math.round(Math.sqrt((system * system + mic * mic) / count) * 10000) / 10000;
    this.onLevel({ system, mic, rms: combined });
  }
}

function spawnParec(parecPath, device) {
  return spawn(
    parecPath,
    [
      `--device=${device}`,
      '--format=s16le',
      `--rate=${SAMPLE_RATE}`,
      '--channels=1',
      '--raw',
      `--latency-msec=${TICK_MS}`,
      '--client-name=DeepSeek Harness',
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

export function startLinuxRecorder({
  captureSystemAudio = true,
  captureMicrophone = true,
  onPcm,
  onSignal,
  onExit,
} = {}) {
  const info = linuxPlatformInfo();
  if (!info.supported) throw new Error(info.reason);
  if (!captureSystemAudio && !captureMicrophone) throw new Error('系统声音与麦克风至少要开启一个');

  const tools = linuxTools();
  const mixer = new PcmMixer({
    onPcm,
    onLevel: (level) => onSignal?.({ type: 'level', ...level }),
  });

  const procs = [];
  let timer = null;
  let stopping = false;
  let killed = false;
  let exitNotified = false;
  let settledReady = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  const stdin = new EventEmitter();
  const child = {
    stdin,
    stdout: new EventEmitter(),
    stderr: new EventEmitter(),
    pid: undefined,
    kill: () => kill(),
  };

  function kill() {
    killed = true;
    stopping = true;
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    for (const entry of procs) {
      try {
        entry.child.kill('SIGKILL');
      } catch {
        /* ignore */
      }
    }
  }

  function startTicker() {
    if (timer) return;
    timer = setInterval(() => {
      try {
        mixer.tick();
      } catch (error) {
        onSignal?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    }, TICK_MS);
    timer.unref?.();
  }

  function fail(message) {
    if (settledReady) {
      onSignal?.({ type: 'error', message });
      return;
    }
    settledReady = true;
    rejectReady(new Error(message));
  }

  function spawnSource(role, device) {
    const entry = { role, device, child: null, stderr: '', exited: false, gotData: false };
    const proc = spawnParec(tools.parec, device);
    entry.child = proc;
    procs.push(entry);
    if (child.pid === undefined) child.pid = proc.pid;

    let resolveExit;
    entry.exit = new Promise((resolve) => {
      resolveExit = resolve;
    });

    let settledFirst = false;
    let resolveFirst;
    let rejectFirst;
    const firstData = new Promise((resolve, reject) => {
      resolveFirst = resolve;
      rejectFirst = reject;
    });
    const timeout = setTimeout(() => {
      if (settledFirst) return;
      settledFirst = true;
      rejectFirst(new Error(`${role === 'system' ? '系统声音' : '麦克风'}在 ${READY_TIMEOUT_MS}ms 内没有数据`));
    }, READY_TIMEOUT_MS);

    proc.stdout.on('data', (chunk) => {
      if (!settledFirst) {
        settledFirst = true;
        clearTimeout(timeout);
        resolveFirst();
      }
      try {
        mixer.push(role, chunk);
      } catch (error) {
        onSignal?.({ type: 'error', message: error instanceof Error ? error.message : String(error) });
      }
    });
    proc.stderr.on('data', (chunk) => {
      entry.stderr += chunk.toString('utf8');
      const lines = entry.stderr.split('\n');
      entry.stderr = lines.pop() || '';
      for (const line of lines) {
        const text = line.trim();
        if (text && /error|fail|denied|refused|invalid|no such/i.test(text)) {
          onSignal?.({ type: 'log', message: text });
        }
      }
    });
    proc.once('error', (error) => {
      if (!settledFirst) {
        settledFirst = true;
        clearTimeout(timeout);
        rejectFirst(new Error(`启动 parec 失败：${error.message}`));
      }
    });
    proc.once('close', (code, signal) => {
      clearTimeout(timeout);
      entry.exited = true;
      resolveExit({ code, signal });
      if (!settledFirst) {
        settledFirst = true;
        const tail = entry.stderr.trim();
        rejectFirst(
          new Error(
            `${role === 'system' ? '系统声音' : '麦克风'}采集失败（code=${code} signal=${signal}）${tail ? `：${tail}` : ''}`,
          ),
        );
        return;
      }
      if (stopping) return;
      if (!exitNotified) {
        exitNotified = true;
        onSignal?.({
          type: 'error',
          message: `${role === 'system' ? '系统声音' : '麦克风'}采集进程已退出（code=${code} signal=${signal}），录音可能不完整`,
        });
        onExit?.({ code, signal });
      }
    });

    return firstData;
  }

  (async () => {
    try {
      const resolved = await resolveCaptureSources({ captureSystemAudio, captureMicrophone, tools });
      if (stopping || killed) {
        settledReady = true;
        resolveReady();
        return;
      }
      if (captureSystemAudio) mixer.addSource('system');
      if (captureMicrophone) mixer.addSource('mic');
      const waits = [];
      if (captureSystemAudio && resolved.system) waits.push(spawnSource('system', resolved.system));
      if (captureMicrophone && resolved.mic) waits.push(spawnSource('mic', resolved.mic));
      startTicker();
      await Promise.all(waits);
      if (stopping || killed) return;
      settledReady = true;
      resolveReady();
      onSignal?.({ type: 'ready' });
    } catch (error) {
      fail(error instanceof Error ? error.message : String(error));
    }
  })();

  const stop = (() => {
    let promise = null;
    return () => {
      if (promise) return promise;
      stopping = true;
      promise = (async () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
        await ready.catch(() => {});
        try {
          mixer.tick();
        } catch {
          /* ignore */
        }
        for (const entry of procs) {
          try {
            entry.child.kill('SIGTERM');
          } catch {
            /* ignore */
          }
        }
        const waits = procs.map((entry) => entry.exit);
        if (waits.length) {
          const forceTimer = setTimeout(() => kill(), STOP_TERMINATE_GRACE_MS);
          await Promise.all(waits);
          clearTimeout(forceTimer);
        }
        return { code: 0, signal: null };
      })();
      return promise;
    };
  })();

  return { child, stop, kill, ready, pid: child.pid };
}

export { SAMPLE_RATE };
