/**
 * 转写层：面向 asr-registry.js 门面（插件自带 SenseVoice / Qwen3-ASR，DSH 语音
 * 服务存在时作为额外来源合并），本插件只负责：
 *   - 找到可用的本地 provider 并触发模型准备；
 *   - 把裸 PCM 按静音点切成合适长度的 WAV 片段；
 *   - 串行调用 transcribe，返回带时间偏移的文本段。
 */

import { BYTES_PER_SECOND, SAMPLE_RATE, pcmLevel, wavHeader } from './storage.js';

const FRAME_BYTES = 640; // 20ms / 16kHz / s16le mono
const FRAMES_PER_SECOND = 50;
const SILENCE_RMS = 0.012;

/** 选出可用的本地 provider：配置的 id 优先，其次任何 sensevoice，最后第一个本地 provider。 */
export function pickProvider(service, preferredId) {
  if (!service) return null;
  let providers;
  try {
    providers = service.listProviders();
  } catch {
    return null;
  }
  if (!Array.isArray(providers) || !providers.length) return null;
  const byId = providers.find((item) => item.id === preferredId);
  if (byId) return byId;
  const sensevoice = providers.find((item) => /sensevoice/i.test(item.id) || /SenseVoice/i.test(item.name || ''));
  if (sensevoice) return sensevoice;
  return providers.find((item) => item.location === 'host-local') || providers[0];
}

/** 某个 provider 的实时准备状态（含 phase 与下载进度）。 */
export function providerView(service, providerId) {
  if (!service) return null;
  try {
    const snapshot = service.snapshot();
    const list = snapshot?.providers || [];
    const view = list.find((item) => item.id === providerId) || list.find((item) => item.location === 'host-local');
    if (!view) return null;
    return {
      id: view.id,
      name: view.name,
      location: view.location,
      languages: view.languages || [],
      preparation: view.preparation || { phase: 'unprepared' },
    };
  } catch {
    return null;
  }
}

/** 正在准备中的 phase（含取消收尾），期间禁止重复触发准备。 */
const BUSY_PHASES = new Set(['checking', 'downloading', 'loading', 'waking', 'cancelling']);
/** 可以（重新）发起准备的 phase。注意 DSH 用 unprepare，旧版本/默认值可能是 unprepared。 */
const IDLE_PHASES = new Set(['unprepare', 'unprepared', 'cancelled', 'failed']);

/** 触发模型准备（下载 / 校验 / 加载），幂等；进度通过 providerView 观察。 */
export function prepareProvider(service, providerId, options) {
  service.prepare(providerId, options);
}

/** 取消正在进行/排队的模型准备（下载中断、文件保留以便续传）。 */
export function cancelPrepare(service, providerId) {
  return service.cancelPreparation(providerId);
}

/** 指定的 provider 是否存在（不存在返回 null）。 */
export function findProvider(service, providerId) {
  if (!service || !providerId) return null;
  try {
    const providers = service.listProviders();
    if (!Array.isArray(providers)) return null;
    return providers.find((item) => item.id === providerId) || null;
  } catch {
    return null;
  }
}

/**
 * 模型列表视图：给设置页渲染「可下载 / 可切换的 ASR 模型列表」。
 * 直接透传 provider.info（含 downloadSources、setupEstimate）和 preparation 进度，
 * 未来 DSH 语音服务注册新的 provider 时，列表会自动多出一行，不需要改前端。
 */
export function providerCatalog(service, selectedId) {
  if (!service) return [];
  let snapshot;
  try {
    snapshot = service.snapshot();
  } catch {
    return [];
  }
  const providers = Array.isArray(snapshot?.providers) ? snapshot.providers : [];
  return providers.map((view) => {
    const preparation = view.preparation || { phase: 'unprepare' };
    const phase = preparation.phase || 'unprepare';
    const location = view.location || 'host-local';
    const ready = phase === 'ready' || phase === 'standby';
    const preparing = BUSY_PHASES.has(phase);
    return {
      id: view.id,
      name: view.name || view.id,
      location,
      languages: Array.isArray(view.languages) ? view.languages : [],
      downloadSources: Array.isArray(view.downloadSources) ? view.downloadSources : [],
      setupEstimate: view.setupEstimate || null,
      // 插件自定义 provider 可声明扩展能力：单次推理窗口上限与是否适合实时转写。
      maxChunkSeconds: Number(view.maxChunkSeconds) > 0 ? Number(view.maxChunkSeconds) : null,
      realtime: view.realtime !== false,
      preparation,
      selected: view.id === selectedId,
      ready,
      preparing,
      // 云端 provider 不需要本地下载；本地 provider 在未就绪/失败/取消后可发起准备。
      canPrepare: !preparing && location !== 'cloud' && IDLE_PHASES.has(phase),
    };
  });
}

export function isProviderReady(view) {
  const phase = view?.preparation?.phase;
  return phase === 'ready' || phase === 'standby';
}

/** 按静音点把 PCM 切成若干块；每块附带起始秒偏移，供文稿时间戳使用。 */
export function splitPcm(pcm, { chunkSeconds = 25, maxChunkSeconds = 50 } = {}) {
  const totalFrames = Math.floor(pcm.length / FRAME_BYTES);
  if (!totalFrames) return [];
  // 部分模型（如 Qwen3-ASR）单次推理窗口有限，切块上限由 provider 的 maxChunkSeconds 决定。
  const limit = Math.max(3, Math.min(50, Math.round(maxChunkSeconds) || 50));
  const target = Math.min(Math.max(8, Math.min(45, Math.round(chunkSeconds))), limit) * FRAMES_PER_SECOND;
  const minFrames = Math.min(3 * FRAMES_PER_SECOND, target);
  const maxFrames = Math.min(target + 10 * FRAMES_PER_SECOND, limit * FRAMES_PER_SECOND);

  const rms = new Float64Array(totalFrames);
  for (let frame = 0; frame < totalFrames; frame += 1) {
    rms[frame] = pcmLevel(pcm.subarray(frame * FRAME_BYTES, (frame + 1) * FRAME_BYTES));
  }

  const chunks = [];
  let start = 0;
  while (start < totalFrames) {
    const remaining = totalFrames - start;
    if (remaining <= maxFrames) {
      chunks.push({ startFrame: start, endFrame: totalFrames });
      break;
    }
    const ideal = start + target;
    const windowStart = Math.max(start + minFrames, ideal - 4 * FRAMES_PER_SECOND);
    const windowEnd = Math.min(start + maxFrames, ideal + 2 * FRAMES_PER_SECOND);
    let cut = ideal;
    let best = Infinity;
    for (let frame = windowStart; frame < windowEnd; frame += 1) {
      if (rms[frame] < best) {
        best = rms[frame];
        cut = frame;
      }
    }
    if (cut <= start) cut = start + target;
    chunks.push({ startFrame: start, endFrame: cut });
    start = cut;
  }

  return chunks.map(({ startFrame, endFrame }) => ({
    pcm: pcm.subarray(startFrame * FRAME_BYTES, endFrame * FRAME_BYTES),
    offsetSec: startFrame / FRAMES_PER_SECOND,
    durationSec: (endFrame - startFrame) / FRAMES_PER_SECOND,
  }));
}

/** 单段 PCM → 带 WAV 头的 Uint8Array。 */
export function toWav(pcm) {
  return Buffer.concat([wavHeader(pcm.length), pcm]);
}

/**
 * 串行转写若干 PCM 段。
 * @param {object} options
 * @param {object} options.transcribe 已绑定的转写函数 (wav: Uint8Array) => Promise<Transcript>
 * @param {(segment: {fromSec:number,toSec:number,text:string,index:number}) => void} [options.onSegment]
 */
export async function transcribeChunks(chunks, { service, providerId, language, signal, onSegment }) {
  const segments = [];
  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index];
    if (!chunk.pcm.length) continue;
    const wav = toWav(chunk.pcm);
    const spec = service.resolve({ audio: new Uint8Array(wav), providerId, language });
    const transcript = await service.transcribe(spec, signal);
    const text = String(transcript?.text || '').trim();
    if (!text) continue;
    const segment = {
      fromSec: Math.round(chunk.offsetSec),
      toSec: Math.round(chunk.offsetSec + (transcript?.audioSeconds || chunk.durationSec)),
      text,
    };
    segments.push(segment);
    onSegment?.({ ...segment, index: segments.length - 1 });
  }
  return segments;
}

/**
 * 实时转写的分块器：按「攒够 chunkSeconds 或遇到明显静音」触发一段转写。
 * 只做缓冲与判断，真正的识别由调用方串行执行。
 */
export class RealtimeSegmenter {
  constructor({ chunkSeconds = 25, onChunk }) {
    this.chunkSeconds = Math.max(8, Math.min(45, Math.round(chunkSeconds)));
    this.onChunk = onChunk;
    this.frames = [];
    this.flushedFrames = 0;
    this.totalBytes = 0;
    this.flushing = false;
    this.pending = Promise.resolve();
  }

  get seconds() {
    return this.totalBytes / BYTES_PER_SECOND;
  }

  push(chunk) {
    this.totalBytes += chunk.length;
    const usable = chunk.length - (chunk.length % FRAME_BYTES);
    for (let offset = 0; offset < usable; offset += FRAME_BYTES) {
      this.frames.push(chunk.subarray(offset, offset + FRAME_BYTES));
    }
    if (usable < chunk.length && chunk.length % FRAME_BYTES) {
      this.frames.push(chunk.subarray(usable));
    }
    this.maybeFlush();
  }

  get bufferedSeconds() {
    return (this.frames.length * FRAME_BYTES) / BYTES_PER_SECOND;
  }

  /** 已经切出去转写的秒数，即下一段的起始时间偏移。 */
  get flushedSeconds() {
    return this.flushedFrames / FRAMES_PER_SECOND;
  }

  /** 取最近 maxSeconds 秒的缓冲音频（不消费缓冲），供实时预览识别使用。 */
  bufferedPcm(maxSeconds = 15) {
    const maxFrames = Math.max(1, Math.round(maxSeconds * FRAMES_PER_SECOND));
    const frames = this.frames.length > maxFrames ? this.frames.slice(-maxFrames) : this.frames;
    if (!frames.length) return Buffer.alloc(0);
    return Buffer.concat(frames);
  }

  maybeFlush() {
    if (this.flushing) return;
    const buffered = this.bufferedSeconds;
    if (buffered < 3) return;
    const tail = this.frames.slice(-Math.ceil(0.6 * FRAMES_PER_SECOND));
    const tailPcm = Buffer.concat(tail);
    const quiet = pcmLevel(tailPcm) < SILENCE_RMS;
    if (buffered < this.chunkSeconds && !quiet) return;
    this.flushNow();
  }

  flushNow() {
    if (this.flushing || !this.frames.length) return;
    const frames = this.frames;
    this.frames = [];
    this.flushing = true;
    const pcm = Buffer.concat(frames);
    const offsetSec = this.flushedFrames / FRAMES_PER_SECOND;
    this.flushedFrames += Math.round(pcm.length / FRAME_BYTES);
    const job = Promise.resolve()
      .then(() => this.onChunk({ pcm, offsetSec, durationSec: pcm.length / BYTES_PER_SECOND }))
      .catch(() => {})
      .finally(() => {
        this.flushing = false;
        this.maybeFlush();
      });
    this.pending = this.pending.then(() => job);
    return job;
  }

  /** 停止时把剩余缓冲全部吐出，并等待队列清空。 */
  async finish() {
    if (this.frames.length >= 1) this.flushNow();
    while (this.flushing) {
      // eslint-disable-next-line no-await-in-loop
      await this.pending.catch(() => {});
    }
    await this.pending.catch(() => {});
  }
}

export const ASR_CONSTANTS = { SAMPLE_RATE, FRAME_BYTES };
