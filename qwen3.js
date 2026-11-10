// Qwen3-ASR 本地识别 provider。
//
// 这个文件在插件自己的进程内注册一个 speechToText provider：模型文件由本插件
// 自行下载/校验/加载，推理跑在独立 worker 线程里，避免阻塞 DSH 主线程。
// 之所以不直接复用 DSH 自带的 SenseVoice provider，是因为 DSH 目前只注册了
// SenseVoice；用户在模型列表里切换模型需要 speechToText 上有多个 provider。
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { Worker } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';

export const QWEN3_PROVIDER_ID = 'qwen3-asr-0.6b';
export const QWEN3_MODEL_NAME = 'Qwen3-ASR-0.6B';

const WORKER_URL = new URL('./qwen3-worker.js', import.meta.url);
const MODEL_ROOT_DEFAULT = join(
  process.env.DSH_HOME ? process.env.DSH_HOME : join(homedir(), '.dsh'),
  'speech-to-text',
  'qwen3-asr-0.6b',
);

const MODEL_ORIGIN_MODELSCOPE = 'https://modelscope.cn';
const MODEL_ORIGIN_HF_MIRROR = 'https://hf-mirror.com';

// 每个文件同时记录两个下载源的相对路径：ModelScope 的仓库布局按 model_0.6B/
// tokenizer/ 分目录，Hugging Face 镜像仓库则把 onnx 放在根目录。
export const QWEN3_FILES = [
  {
    path: 'conv_frontend.onnx',
    bytes: 44_148_281,
    modelscope: 'model_0.6B/conv_frontend.onnx',
    huggingface: 'conv_frontend.onnx',
  },
  {
    path: 'encoder.int8.onnx',
    bytes: 182_491_662,
    modelscope: 'model_0.6B/encoder.int8.onnx',
    huggingface: 'encoder.int8.onnx',
  },
  {
    path: 'decoder.int8.onnx',
    bytes: 755_914_231,
    modelscope: 'model_0.6B/decoder.int8.onnx',
    huggingface: 'decoder.int8.onnx',
  },
  {
    path: 'tokenizer/vocab.json',
    bytes: 2_776_833,
    modelscope: 'tokenizer/vocab.json',
    huggingface: 'tokenizer/vocab.json',
  },
  {
    path: 'tokenizer/merges.txt',
    bytes: 1_671_853,
    modelscope: 'tokenizer/merges.txt',
    huggingface: 'tokenizer/merges.txt',
  },
  {
    path: 'tokenizer/tokenizer_config.json',
    bytes: 12_487,
    modelscope: 'tokenizer/tokenizer_config.json',
    huggingface: 'tokenizer/tokenizer_config.json',
  },
];

const DOWNLOAD_SOURCES = [
  {
    origin: MODEL_ORIGIN_MODELSCOPE,
    base: 'https://modelscope.cn/models/zengshuishui/Qwen3-ASR-onnx/resolve/master',
    layout: 'modelscope',
  },
  {
    origin: MODEL_ORIGIN_HF_MIRROR,
    base: 'https://hf-mirror.com/csukuangfj2/sherpa-onnx-qwen3-asr-0.6B-int8-2026-03-25/resolve/main',
    layout: 'huggingface',
  },
];

const STEP_KINDS = ['check', 'model', 'verify', 'load'];
const LANGUAGES = ['auto', 'zh', 'en', 'yue', 'ja', 'ko'];
const PROGRESS_INTERVAL_MS = 100;
const LOAD_TIMEOUT_MS = 180_000;
const INFERENCE_TIMEOUT_MS = 120_000;
const IDLE_TIMEOUT_MS = 300_000;

const DOWNLOAD_CODES = [
  ['dns', /^(ENOTFOUND|EAI_AGAIN)$/],
  ['timeout', /^(ETIMEDOUT|ERR_SOCKET_CONNECTION_TIMEOUT|UND_ERR_(CONNECT|HEADERS|BODY)_TIMEOUT)$/],
  [
    'certificate',
    /^(CERT_[A-Z_]+|ERR_TLS_CERT_ALTNAME_INVALID|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|UNABLE_TO_VERIFY_LEAF_SIGNATURE|UNABLE_TO_GET_ISSUER_CERT_LOCALLY)$/,
  ],
  ['storage', /^(ENOSPC|EDQUOT|EACCES|EPERM|EROFS)$/],
  ['network', /^(ECONNREFUSED|ECONNRESET|ENETUNREACH|EHOSTUNREACH|EPIPE|UND_ERR_SOCKET)$/],
];

/** 把网络/文件系统错误归类成模型列表可以直接解释的 download.reason。 */
export function classifyDownloadFailure(failure) {
  const pending = [failure];
  const visited = new Set();
  let reason = 'unknown';
  let code;
  while (pending.length > 0) {
    const error = pending.shift();
    if (!(error instanceof Error) || visited.has(error)) continue;
    visited.add(error);
    if (error.name === 'TimeoutError' || error.name === 'AbortError') return { reason: 'timeout', code };
    if ('code' in error && typeof error.code === 'string') {
      for (const [kind, pattern] of DOWNLOAD_CODES) {
        if (pattern.test(error.code)) return { reason: kind, code: error.code };
      }
    }
    if (error instanceof TypeError && error.message === 'fetch failed') reason = 'network';
    pending.push(error.cause);
    if (error instanceof AggregateError) pending.push(...error.errors);
  }
  return { reason, code };
}

class SpeechDownloadError extends Error {
  constructor(download, options) {
    super(
      `Unable to download ${download.resource} from ${download.source}: ${download.reason}` +
        `${download.code ? ` (${download.code})` : ''}${download.status ? ` (HTTP ${download.status})` : ''}`,
      options,
    );
    this.download = download;
  }
}

/**
 * 解析一段 WAV（PCM 16/32-bit）为 Float32 采样。
 * 插件在录音和转写时都以 WAV 字节在 Host/worker 之间传递音频。
 */
export function parseWav(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const data = new DataView(view.buffer, view.byteOffset, view.byteLength);
  const tag = (offset) =>
    String.fromCharCode(view[offset], view[offset + 1], view[offset + 2], view[offset + 3]);
  if (view.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    throw new Error('Invalid WAV audio');
  }
  let offset = 12;
  let format = 1;
  let channels = 1;
  let sampleRate = 16_000;
  let bitsPerSample = 16;
  let samplesOffset = -1;
  let samplesBytes = 0;
  while (offset + 8 <= view.byteLength) {
    const id = tag(offset);
    const size = data.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = data.getUint16(body, true);
      channels = data.getUint16(body + 2, true) || 1;
      sampleRate = data.getUint32(body + 4, true) || 16_000;
      bitsPerSample = data.getUint16(body + 14, true) || 16;
      if (format === 0xfffe && size >= 26) format = data.getUint16(body + 24, true) || format;
    } else if (id === 'data') {
      samplesOffset = body;
      samplesBytes = Math.min(size, view.byteLength - body);
    }
    offset = body + size + (size % 2);
  }
  if (samplesOffset < 0 || samplesBytes <= 0) throw new Error('WAV audio has no samples');
  if (format !== 1 && format !== 3) throw new Error(`Unsupported WAV format ${format}`);
  const bytesPerSample = bitsPerSample / 8;
  const frames = Math.floor(samplesBytes / (bytesPerSample * channels));
  const samples = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    const start = samplesOffset + frame * bytesPerSample * channels;
    if (format === 3 && bitsPerSample === 32) samples[frame] = data.getFloat32(start, true);
    else if (bitsPerSample === 16) samples[frame] = data.getInt16(start, true) / 32768;
    else if (bitsPerSample === 32) samples[frame] = data.getInt32(start, true) / 2147483648;
    else if (bitsPerSample === 8) samples[frame] = (view[start] - 128) / 128;
    else throw new Error(`Unsupported WAV bit depth ${bitsPerSample}`);
  }
  if (channels > 1) {
    const mono = new Float32Array(frames);
    for (let frame = 0; frame < frames; frame += 1) {
      const start = frame * channels;
      let sum = 0;
      for (let channel = 0; channel < channels; channel += 1) sum += samples[start + channel];
      mono[frame] = sum / channels;
    }
    return { sampleRate, samples: mono };
  }
  return { sampleRate, samples };
}

class Qwen3Worker {
  constructor() {
    this.worker = new Worker(WORKER_URL);
    this.pending = new Map();
    this.nextId = 1;
    this.closed = false;
    this.worker.on('message', (message) => this.handleMessage(message));
    this.worker.on('error', (error) => this.failAll(error));
    this.worker.on('exit', (code) => {
      if (!this.closed) this.failAll(new Error(`Qwen3-ASR worker exited with code ${code}`));
    });
  }

  handleMessage(message) {
    if (message.type === 'loaded') {
      this.resolve('load', null);
      return;
    }
    const job = message.id === undefined ? undefined : this.pending.get(message.id);
    if (!job) return;
    this.pending.delete(message.id);
    if (message.type === 'result') job.resolve(message.text);
    else job.reject(new Error(message.message || 'Qwen3-ASR inference failed'));
  }

  resolve(kind, value) {
    const job = this.pending.get(kind);
    if (!job) return;
    this.pending.delete(kind);
    job.resolve(value);
  }

  failAll(error) {
    for (const [id, job] of this.pending) {
      this.pending.delete(id);
      job.reject(error);
    }
    if (!this.closed) {
      this.closed = true;
      this.worker.terminate().catch(() => {});
    }
  }

  request(kind, message, timeoutMs) {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        reject(new Error('Qwen3-ASR worker is closed'));
        return;
      }
      const timer = setTimeout(() => {
        this.pending.delete(kind);
        reject(new Error('Qwen3-ASR 推理超时'));
      }, timeoutMs);
      this.pending.set(kind, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      try {
        this.worker.postMessage(message);
      } catch (error) {
        clearTimeout(timer);
        this.pending.delete(kind);
        reject(error);
      }
    });
  }

  load(config) {
    return this.request('load', { type: 'load', config }, LOAD_TIMEOUT_MS);
  }

  transcribe(samples, sampleRate, timeoutMs = INFERENCE_TIMEOUT_MS) {
    const id = this.nextId++;
    const buffer = samples.buffer.slice(samples.byteOffset, samples.byteOffset + samples.byteLength);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('Qwen3-ASR 识别超时'));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.worker.postMessage({ type: 'transcribe', id, samples: buffer, sampleRate }, [buffer]);
    });
  }

  async close() {
    if (this.closed) return;
    this.closed = true;
    try {
      this.worker.postMessage({ type: 'close' });
    } catch {
      // 进程已经在退出，忽略
    }
    await this.worker.terminate().catch(() => {});
  }
}

export class Qwen3Preparation {
  constructor(options = {}) {
    this.modelRoot = options.modelRoot ? options.modelRoot : MODEL_ROOT_DEFAULT;
    this.threads = options.threads ? options.threads : 2;
    this.listeners = new Set();
    this.state = {
      phase: 'unprepare',
      steps: STEP_KINDS.map((kind) => ({ kind, status: 'pending' })),
    };
    this.task = undefined;
    this.worker = undefined;
    this.idleTimer = undefined;
    this.lastProgressAt = 0;
    this.disposed = false;
  }

  snapshot() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(state) {
    const previous = this.state;
    const steps = state.steps
      ? state.steps
      : previous.steps.map((item) => {
          if (state.phase === 'ready') return { ...item, status: 'complete' };
          if (state.phase === 'failed' || state.phase === 'cancelled') {
            return item.status === 'running' ? { ...item, status: state.phase } : item;
          }
          if (state.step === item.kind) {
            return item.status === 'running' ? item : { kind: item.kind, status: 'running', startedAt: Date.now() };
          }
          if (item.status === 'running') return { ...item, status: 'complete' };
          return item;
        });
    this.state = { ...state, steps };
    const now = performance.now();
    if (
      state.phase === 'downloading' &&
      previous.phase === 'downloading' &&
      state.resource === previous.resource &&
      state.completedBytes !== state.totalBytes &&
      now - this.lastProgressAt < PROGRESS_INTERVAL_MS
    ) {
      return;
    }
    this.lastProgressAt = now;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch {
        // 订阅方异常不应影响准备任务
      }
    }
  }

  /**
   * 注册时扫描一次模型缓存：文件齐全就直接进入 standby，避免设置页显示「未准备」。
   */
  inspect() {
    this.run(async () => {
      this.publish({ phase: 'checking', step: 'check' });
      const ready = await this.filesReady();
      if (ready) this.publish({ phase: 'standby', step: undefined });
      else
        this.publish({
          phase: 'unprepare',
          steps: STEP_KINDS.map((kind) => ({ kind, status: kind === 'check' ? 'complete' : 'pending' })),
        });
    });
  }

  prepare(options = {}) {
    const source = options.downloadSource;
    if (source !== undefined && !DOWNLOAD_SOURCES.some((item) => item.origin === source)) {
      throw new Error('不支持的模型下载来源');
    }
    if (this.worker && (this.state.phase === 'ready' || this.state.phase === 'standby')) {
      this.run(async () => {
        await this.loadWorker();
      });
      return;
    }
    this.run(async (signal) => {
      const sources = source === undefined ? DOWNLOAD_SOURCES : DOWNLOAD_SOURCES.filter((item) => item.origin === source);
      await this.start(signal, sources);
    });
  }

  async cancel() {
    const task = this.task;
    if (!task) return;
    if (!task.completed) {
      this.publish({ phase: 'cancelling' });
      task.abort.abort(new Error('模型准备已取消'));
    }
    await task.settled;
  }

  async dispose() {
    this.disposed = true;
    clearTimeout(this.idleTimer);
    await this.cancel();
    if (this.worker) {
      const worker = this.worker;
      this.worker = undefined;
      await worker.close();
    }
    this.listeners.clear();
  }

  run(run) {
    if (this.task || this.disposed) return;
    const abort = new AbortController();
    const task = { abort, settled: Promise.resolve(), completed: false };
    this.task = task;
    task.settled = Promise.resolve()
      .then(() => run(abort.signal))
      .catch((error) => {
        if (this.disposed) return;
        if (abort.signal.aborted) {
          this.cleanupPartialFiles().catch(() => {});
          this.publish({ phase: 'cancelled' });
          return;
        }
        this.publish({
          phase: 'failed',
          message: error instanceof Error ? error.message : String(error),
          ...(error instanceof SpeechDownloadError ? { download: error.download } : {}),
        });
      })
      .finally(() => {
        task.completed = true;
        this.task = undefined;
      });
  }

  filesReady() {
    return this.filesPresent();
  }

  async filesPresent() {
    for (const file of QWEN3_FILES) {
      try {
        const info = await stat(join(this.modelRoot, file.path));
        if (!info.isFile() || info.size !== file.bytes) return false;
      } catch {
        return false;
      }
    }
    return true;
  }

  async cleanupPartialFiles() {
    for (const file of QWEN3_FILES) {
      await rm(join(this.modelRoot, `${file.path}.part`), { force: true }).catch(() => {});
    }
  }

  async start(signal, sources) {
    signal.throwIfAborted();
    this.publish({ phase: 'checking', step: 'check' });
    try {
      await mkdir(join(this.modelRoot, 'tokenizer'), { recursive: true });
    } catch (error) {
      const failure = classifyDownloadFailure(error);
      throw new SpeechDownloadError({ resource: '模型目录', source: this.modelRoot, reason: failure.reason, code: failure.code });
    }
    await this.download(signal, sources);
    await this.verify(signal);
    await this.loadWorker(signal);
  }

  async download(signal, sources) {
    const totalBytes = QWEN3_FILES.reduce((sum, file) => sum + file.bytes, 0);
    this.publish({
      phase: 'downloading',
      step: 'model',
      totalBytes,
      completedBytes: 0,
      resource: QWEN3_FILES[0].path,
    });
    let completedBytes = 0;
    for (const file of QWEN3_FILES) {
      signal.throwIfAborted();
      const target = join(this.modelRoot, file.path);
      const existing = await stat(target).catch(() => undefined);
      if (existing && existing.size === file.bytes) {
        completedBytes += file.bytes;
        continue;
      }
      await this.downloadFile(file, target, sources, signal, completedBytes, totalBytes);
      completedBytes += file.bytes;
      this.publish({
        phase: 'downloading',
        step: 'model',
        totalBytes,
        completedBytes,
        resource: file.path,
      });
    }
  }

  async downloadFile(file, target, sources, signal, baseBytes, totalBytes) {
    await mkdir(dirname(target), { recursive: true });
    const partial = `${target}.part`;
    let lastError;
    for (const source of sources) {
      signal.throwIfAborted();
      const relative = source.layout === 'modelscope' ? file.modelscope : file.huggingface;
      const url = `${source.base}/${relative}`;
      try {
        await this.streamToFile(url, partial, file, signal, (bytes) => {
          this.publish({
            phase: 'downloading',
            step: 'model',
            totalBytes,
            completedBytes: baseBytes + bytes,
            resource: file.path,
          });
        });
        await rm(target, { force: true });
        await rename(partial, target);
        return;
      } catch (error) {
        await rm(partial, { force: true }).catch(() => {});
        if (signal.aborted) throw error;
        lastError = error;
      }
    }
    const failure = classifyDownloadFailure(lastError);
    const download = {
      resource: file.path,
      source: sources[0]?.origin ?? '',
      reason: failure.reason,
      code: failure.code,
    };
    if (lastError instanceof SpeechDownloadError) throw lastError;
    throw new SpeechDownloadError(download);
  }

  async streamToFile(url, partial, file, signal, onProgress) {
    let response;
    try {
      response = await fetch(url, { signal, redirect: 'follow' });
    } catch (error) {
      throw error;
    }
    if (!response.ok || !response.body) {
      throw new SpeechDownloadError({
        resource: file.path,
        source: new URL(url).origin,
        reason: 'http',
        status: response.status,
      });
    }
    let received = 0;
    const sink = createWriteStream(partial);
    const body = Readable.fromWeb(response.body);
    body.on('data', (chunk) => {
      received += chunk.length;
      onProgress(received);
    });
    try {
      await pipeline(body, sink);
    } catch (error) {
      sink.destroy();
      throw error;
    }
    if (received !== file.bytes) {
      throw new SpeechDownloadError({
        resource: file.path,
        source: new URL(url).origin,
        reason: 'integrity',
      });
    }
  }

  async verify(signal) {
    signal.throwIfAborted();
    this.publish({ phase: 'checking', step: 'verify', resource: undefined });
    for (const file of QWEN3_FILES) {
      const info = await stat(join(this.modelRoot, file.path)).catch(() => undefined);
      if (!info || info.size !== file.bytes) {
        throw new SpeechDownloadError({
          resource: file.path,
          source: this.modelRoot,
          reason: 'integrity',
        });
      }
    }
  }

  nativeConfig() {
    return {
      featConfig: { sampleRate: 16_000, featureDim: 80 },
      modelConfig: {
        qwen3Asr: {
          convFrontend: join(this.modelRoot, 'conv_frontend.onnx'),
          encoder: join(this.modelRoot, 'encoder.int8.onnx'),
          decoder: join(this.modelRoot, 'decoder.int8.onnx'),
          tokenizer: join(this.modelRoot, 'tokenizer'),
          hotwords: '',
        },
        tokens: '',
        numThreads: this.threads,
        provider: 'cpu',
        debug: 0,
      },
    };
  }

  async loadWorker(signal) {
    signal?.throwIfAborted();
    if (this.worker) return this.worker;
    this.publish({ phase: 'loading', step: 'load' });
    const worker = new Qwen3Worker();
    try {
      await worker.load(this.nativeConfig());
    } catch (error) {
      await worker.close();
      throw new Error(`Qwen3-ASR 模型加载失败：${error instanceof Error ? error.message : String(error)}`);
    }
    if (signal?.aborted) {
      await worker.close();
      throw signal.reason instanceof Error ? signal.reason : new Error('模型准备已取消');
    }
    this.worker = worker;
    this.publish({ phase: 'ready', step: 'load' });
    return worker;
  }

  async ensureWorker(signal) {
    signal?.throwIfAborted();
    if (this.worker && !this.worker.closed) return this.worker;
    return this.loadWorker(signal);
  }

  scheduleIdle() {
    clearTimeout(this.idleTimer);
    if (this.disposed) return;
    this.idleTimer = setTimeout(() => {
      const worker = this.worker;
      this.worker = undefined;
      if (worker) {
        worker.close().catch(() => {});
        this.publish({ phase: 'standby' });
      }
    }, IDLE_TIMEOUT_MS);
    this.idleTimer.unref?.();
  }

  async transcribe(input, signal) {
    if (this.state.phase === 'failed' || this.state.phase === 'unprepare') {
      throw new Error('Qwen3-ASR 模型尚未准备，请先在设置页下载并准备模型');
    }
    clearTimeout(this.idleTimer);
    const worker = await this.ensureWorker(signal);
    const { sampleRate, samples } = parseWav(input.audio);
    const startedAt = Date.now();
    const text = await worker.transcribe(samples, sampleRate, INFERENCE_TIMEOUT_MS);
    this.scheduleIdle();
    return {
      text,
      audioSeconds: samples.length / sampleRate,
      inferenceSeconds: (Date.now() - startedAt) / 1000,
    };
  }
}

/**
 * 构造 speechToText provider。info 字段会被 DSH 直接暴露给模型列表，
 * maxChunkSeconds / realtime 是本插件的扩展字段：前者约束切块长度，后者给 UI 提示。
 */
export function createQwen3Provider(options = {}) {
  const preparation = new Qwen3Preparation(options);
  preparation.inspect();
  return {
    info: {
      id: QWEN3_PROVIDER_ID,
      name: `${QWEN3_MODEL_NAME} (INT8)`,
      location: 'host-local',
      languages: LANGUAGES,
      downloadSources: DOWNLOAD_SOURCES.map((source) => source.origin),
      setupEstimate: {
        recommendedDiskBytes: 1_150_000_000,
        expectedMemoryBytes: 1_600_000_000,
        minimumMinutes: 3,
        maximumMinutes: 25,
      },
      maxChunkSeconds: 30,
      realtime: false,
    },
    preparation,
    transcribe: (input, signal) => preparation.transcribe(input, signal),
    dispose: () => preparation.dispose(),
  };
}

export const QWEN3_DOWNLOAD_SOURCES = DOWNLOAD_SOURCES;
