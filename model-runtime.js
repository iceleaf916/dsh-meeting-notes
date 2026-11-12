// 本地识别模型运行时：下载、校验、准备状态机与 worker 推理。
//
// SenseVoice 与 Qwen3-ASR 两个 provider 都需要同一套「下载 → 校验 → 加载 → 空闲卸载」
// 流程，差别只在模型文件清单、下载源与 sherpa-onnx 的 recognizer 配置。这里把它们
// 参数化，避免两套实现各自演化出不同的进度/失败语义。
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, rename, rm, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { Worker } from 'node:worker_threads';

import { parseWav } from './wav.js';

const PROGRESS_INTERVAL_MS = 100;
const LOAD_TIMEOUT_MS = 180_000;
const INFERENCE_TIMEOUT_MS = 120_000;
const IDLE_TIMEOUT_MS = 300_000;
const DEFAULT_STEPS = ['check', 'model', 'verify', 'load'];

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

export class SpeechDownloadError extends Error {
  constructor(download, options) {
    super(
      `Unable to download ${download.resource} from ${download.source}: ${download.reason}` +
        `${download.code ? ` (${download.code})` : ''}${download.status ? ` (HTTP ${download.status})` : ''}`,
      options,
    );
    this.download = download;
  }
}

async function sha256File(file) {
  const hash = createHash('sha256');
  await pipeline(createReadStream(file), hash);
  return hash.digest('hex');
}

/** 一个 worker 的 RPC 连接：load / transcribe / close 三种消息。 */
export class ModelWorker {
  constructor(workerUrl, label) {
    this.label = label;
    this.worker = new Worker(workerUrl);
    this.pending = new Map();
    this.nextId = 1;
    this.closed = false;
    this.worker.on('message', (message) => this.handleMessage(message));
    this.worker.on('error', (error) => this.failAll(error));
    this.worker.on('exit', (code) => {
      if (!this.closed) this.failAll(new Error(`${this.label} worker exited with code ${code}`));
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
    else job.reject(new Error(message.message || `${this.label} inference failed`));
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
        reject(new Error(`${this.label} worker is closed`));
        return;
      }
      const timer = setTimeout(() => {
        this.pending.delete(kind);
        reject(new Error(`${this.label} 加载超时`));
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
        reject(new Error(`${this.label} 识别超时`));
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

/**
 * 模型准备状态机 + 推理入口。
 *
 * options:
 *   modelRoot   模型目录（绝对路径）
 *   threads     CPU 线程数
 *   assets      [{ path, bytes, sha256?, modelscope?, huggingface? }]，path 相对 modelRoot
 *   sources     [{ origin, base, layout: 'modelscope' | 'huggingface' }]
 *   workerUrl   推理 worker 入口
 *   label       日志/错误文案里的引擎名，例如 'SenseVoice' / 'Qwen3-ASR'
 *   nativeConfig (modelRoot, threads) => sherpa-onnx recognizer 配置
 *   steps       准备步骤 kind 列表，默认 ['check','model','verify','load']
 *   idleTimeoutMs 空闲卸载 worker 的毫秒数
 */
export class ModelPreparation {
  constructor(options = {}) {
    if (!options.modelRoot) throw new Error('modelRoot is required');
    if (!Array.isArray(options.assets) || options.assets.length === 0) throw new Error('assets is required');
    if (typeof options.nativeConfig !== 'function') throw new Error('nativeConfig is required');
    this.modelRoot = options.modelRoot;
    this.threads = options.threads ? options.threads : 2;
    this.assets = options.assets;
    this.sources = options.sources || [];
    this.workerUrl = options.workerUrl;
    this.label = options.label || 'ASR';
    this.nativeConfigFor = options.nativeConfig;
    this.stepKinds = options.steps || DEFAULT_STEPS;
    this.idleTimeoutMs = options.idleTimeoutMs || IDLE_TIMEOUT_MS;
    this.listeners = new Set();
    this.state = {
      phase: 'unprepare',
      steps: this.stepKinds.map((kind) => ({ kind, status: 'pending' })),
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
          steps: this.stepKinds.map((kind) => ({ kind, status: kind === 'check' ? 'complete' : 'pending' })),
        });
    });
  }

  prepare(options = {}) {
    const source = options.downloadSource;
    if (source !== undefined && !this.sources.some((item) => item.origin === source)) {
      throw new Error('不支持的模型下载来源');
    }
    if (this.worker && (this.state.phase === 'ready' || this.state.phase === 'standby')) {
      this.run(async () => {
        await this.loadWorker();
      });
      return;
    }
    this.run(async (signal) => {
      const sources = source === undefined ? this.sources : this.sources.filter((item) => item.origin === source);
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
    for (const file of this.assets) {
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
    for (const file of this.assets) {
      await rm(join(this.modelRoot, `${file.path}.part`), { force: true }).catch(() => {});
    }
  }

  async start(signal, sources) {
    signal.throwIfAborted();
    this.publish({ phase: 'checking', step: 'check' });
    try {
      await mkdir(this.modelRoot, { recursive: true });
    } catch (error) {
      const failure = classifyDownloadFailure(error);
      throw new SpeechDownloadError({ resource: '模型目录', source: this.modelRoot, reason: failure.reason, code: failure.code });
    }
    await this.download(signal, sources);
    await this.verify(signal);
    await this.loadWorker(signal);
  }

  async download(signal, sources) {
    const totalBytes = this.assets.reduce((sum, file) => sum + file.bytes, 0);
    this.publish({
      phase: 'downloading',
      step: 'model',
      totalBytes,
      completedBytes: 0,
      resource: this.assets[0].path,
    });
    let completedBytes = 0;
    for (const file of this.assets) {
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
    let attempted = false;
    for (const source of sources) {
      signal.throwIfAborted();
      const relative = source.layout === 'modelscope' ? file.modelscope : source.layout === 'huggingface' ? file.huggingface : undefined;
      if (!relative) continue;
      attempted = true;
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
    if (!attempted) throw new Error(`没有可用的下载来源：${file.path}`);
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
    const response = await fetch(url, { signal, redirect: 'follow' });
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
    for (const file of this.assets) {
      const target = join(this.modelRoot, file.path);
      const info = await stat(target).catch(() => undefined);
      if (!info || info.size !== file.bytes) {
        throw new SpeechDownloadError({
          resource: file.path,
          source: this.modelRoot,
          reason: 'integrity',
        });
      }
      if (file.sha256) {
        let digest;
        try {
          digest = await sha256File(target);
        } catch {
          digest = undefined;
        }
        if (digest !== file.sha256) {
          await rm(target, { force: true }).catch(() => {});
          throw new SpeechDownloadError({
            resource: file.path,
            source: this.modelRoot,
            reason: 'integrity',
          });
        }
      }
    }
  }

  nativeConfig() {
    return this.nativeConfigFor(this.modelRoot, this.threads);
  }

  async loadWorker(signal) {
    signal?.throwIfAborted();
    if (this.worker) return this.worker;
    this.publish({ phase: 'loading', step: 'load' });
    const worker = new ModelWorker(this.workerUrl, this.label);
    try {
      await worker.load(this.nativeConfig());
    } catch (error) {
      await worker.close();
      throw new Error(`${this.label} 模型加载失败：${error instanceof Error ? error.message : String(error)}`);
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
    }, this.idleTimeoutMs);
    this.idleTimer.unref?.();
  }

  async transcribe(input, signal) {
    if (this.state.phase === 'failed' || this.state.phase === 'unprepare') {
      throw new Error(`${this.label} 模型尚未准备，请先在设置页下载并准备模型`);
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
 * 构造 speechToText provider。info 字段会被 DSH / 本插件模型列表直接暴露。
 * maxChunkSeconds 与 realtime 是本插件的扩展字段：前者约束切块长度，后者给 UI 提示。
 */
export function createModelProvider({ preparation, ...info }) {
  preparation.inspect();
  const providerInfo = { location: 'host-local', ...info };
  return {
    info: providerInfo,
    preparation,
    transcribe: (input, signal) => preparation.transcribe(input, signal),
    dispose: () => preparation.dispose(),
  };
}
