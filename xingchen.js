// 硅基流动（SiliconFlow）云端识别 provider：XingChenASR-V3.2-Ultra。
//
// 与 SenseVoice / Qwen3 的本地 provider 不同，它没有下载与加载阶段：
//   - 密钥来自插件配置 siliconflowApiKey，也接受环境变量 SILICONFLOW_API_KEY；
//   - 准备状态是实时推导的：有密钥即 ready，没有就 unprepare 并给出说明；
//   - 每个音频片段以 multipart/form-data POST 到 /v1/audio/transcriptions。
// 模型自动识别中文 / 英文 / 方言（官方说明：中 + 英 + 60 种方言混说），
// 因此不向接口传 language 字段（文档也只列了 file 与 model）。
import { BYTES_PER_SECOND } from './storage.js';

export const XINGCHEN_PROVIDER_ID = 'xingchen-asr';
export const XINGCHEN_MODEL = 'XingChenAGI/XingChenASR-V3.2-Ultra';
export const XINGCHEN_BASE_URL = 'https://api.siliconflow.cn/v1';
// 官方文档：file ≤ 50 MB、时长 ≤ 1 小时。插件按 maxChunkSeconds 切块，实际远小于上限。
export const XINGCHEN_MAX_AUDIO_BYTES = 50 * 1024 * 1024;
export const XINGCHEN_LANGUAGES = ['auto', 'zh', 'en', 'yue'];

const REQUEST_TIMEOUT_MS = 120_000;
const RETRY_DELAY_MS = 800;
// 没有密钥时模型行的说明（phase=unprepare，不显示「准备失败」）。
export const XINGCHEN_NO_KEY_MESSAGE =
  '未配置硅基流动 API 密钥：请在模型下方的输入框中填写后使用云端识别。';

/** 配置值优先，其次环境变量；都为空时返回空串。 */
export function resolveXingchenApiKey(value) {
  const configured = typeof value === 'string' ? value.trim() : '';
  if (configured) return configured;
  return String(process.env.SILICONFLOW_API_KEY || '').trim();
}

/** 规范化 base URL：去掉末尾斜杠，缺省用官方地址。 */
export function normalizeXingchenBaseUrl(value) {
  const raw = String(value || '').trim() || XINGCHEN_BASE_URL;
  return raw.replace(/\/+$/, '');
}

function httpError(status, body) {
  const serverMessage = typeof body?.message === 'string' ? body.message.trim() : '';
  const errorCode = body?.code ? `，错误码 ${body.code}` : '';
  let friendly;
  if (status === 401 || status === 403) friendly = 'API 密钥无效或没有权限';
  else if (status === 402) friendly = '账户余额不足';
  else if (status === 404) friendly = '接口或模型不存在';
  else if (status === 429) friendly = '请求过于频繁';
  else if (status >= 500) friendly = '服务暂时不可用';
  else friendly = '请求被拒绝';
  const error = new Error(
    `硅基流动语音识别失败（HTTP ${status}${errorCode}，${friendly}）${serverMessage ? `：${serverMessage}` : ''}`,
  );
  error.status = status;
  error.code = body?.code;
  error.retryable = status === 429 || status >= 500;
  return error;
}

function networkError(cause) {
  const error = new Error(`无法连接硅基流动语音识别服务：${cause instanceof Error ? cause.message : String(cause)}`);
  error.retryable = true;
  error.cause = cause;
  return error;
}

function timeoutError(timeoutMs) {
  const error = new Error(`硅基流动语音识别超时（${Math.round(timeoutMs / 1000)} 秒）`);
  error.retryable = true;
  return error;
}

function toBytes(audio) {
  if (audio instanceof Uint8Array) return audio;
  if (audio instanceof ArrayBuffer) return new Uint8Array(audio);
  if (ArrayBuffer.isView(audio)) return new Uint8Array(audio.buffer, audio.byteOffset, audio.byteLength);
  return new Uint8Array(0);
}

function wait(ms, signal) {
  if (!(ms > 0)) return Promise.resolve();
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(done, ms);
    function done() {
      clearTimeout(timer);
      signal?.removeEventListener?.('abort', done);
      resolve();
    }
    signal?.addEventListener?.('abort', done, { once: true });
  });
}

/**
 * 发起一次转写请求。
 * @param {object} options
 * @param {Uint8Array} options.audio WAV 字节
 * @param {string} options.apiKey
 * @param {string} options.baseUrl
 * @param {string} options.model
 * @param {AbortSignal} [options.signal]
 * @param {number} [options.timeoutMs]
 * @param {typeof fetch} [options.fetchImpl]
 */
export async function requestXingchenTranscription({
  audio,
  apiKey,
  baseUrl,
  model,
  signal,
  timeoutMs = REQUEST_TIMEOUT_MS,
  fetchImpl = globalThis.fetch,
}) {
  if (typeof fetchImpl !== 'function') throw new Error('当前 Node 环境没有 fetch，无法调用硅基流动接口');
  const form = new FormData();
  form.append('file', new Blob([audio], { type: 'audio/wav' }), 'chunk.wav');
  form.append('model', model);

  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  else signal?.addEventListener?.('abort', onAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    let response;
    try {
      response = await fetchImpl(`${baseUrl}/audio/transcriptions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}` },
        body: form,
        signal: controller.signal,
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      if (timedOut) throw timeoutError(timeoutMs);
      throw networkError(error);
    }
    const raw = await response.text();
    let body = null;
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        body = null;
      }
    }
    if (!response.ok) throw httpError(response.status, body);
    if (!body || typeof body.text !== 'string') {
      throw new Error('硅基流动语音识别返回了无法解析的结果');
    }
    const audioSeconds = Number(body.duration) > 0 ? Number(body.duration) : Math.max(0, (audio.byteLength - 44) / BYTES_PER_SECOND);
    return { text: body.text, audioSeconds };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener?.('abort', onAbort);
  }
}

/** 带一次重试：网络错误、超时、429 与 5xx 重试一次，鉴权 / 参数错误直接失败。 */
async function requestWithRetry(options) {
  let last;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestXingchenTranscription(options);
    } catch (error) {
      last = error;
      if (error?.retryable !== true || attempt === 1 || options.signal?.aborted) throw error;
      await wait(RETRY_DELAY_MS, options.signal);
    }
  }
  throw last;
}

/**
 * 云端 provider 的「准备」：没有下载/加载，只是把密钥是否就绪映射成模型行状态。
 */
class XingchenPreparation {
  constructor({ getApiKey, baseUrl, model, fetchImpl, timeoutMs }) {
    this.getApiKey = getApiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.fetchImpl = fetchImpl;
    this.timeoutMs = timeoutMs;
    this.controllers = new Set();
  }

  apiKey() {
    return resolveXingchenApiKey(this.getApiKey());
  }

  snapshot() {
    return this.apiKey() ? { phase: 'ready' } : { phase: 'unprepare', message: XINGCHEN_NO_KEY_MESSAGE };
  }

  inspect() {
    return this.snapshot();
  }

  prepare() {
    if (!this.apiKey()) throw new Error(XINGCHEN_NO_KEY_MESSAGE);
    return this.snapshot();
  }

  cancel() {
    /* 云端模型没有可取消的下载或加载 */
  }

  async transcribe(input, signal) {
    const apiKey = this.apiKey();
    if (!apiKey) throw new Error(XINGCHEN_NO_KEY_MESSAGE);
    const audio = toBytes(input?.audio);
    if (audio.byteLength <= 44) throw new Error('录音片段为空，无法转写');
    if (audio.byteLength > XINGCHEN_MAX_AUDIO_BYTES) {
      throw new Error(`录音片段超过硅基流动 ${Math.round(XINGCHEN_MAX_AUDIO_BYTES / 1024 / 1024)} MB 上限`);
    }

    const controller = new AbortController();
    const onAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener?.('abort', onAbort, { once: true });
    this.controllers.add(controller);
    try {
      return await requestWithRetry({
        audio,
        apiKey,
        baseUrl: this.baseUrl,
        model: this.model,
        signal: controller.signal,
        timeoutMs: this.timeoutMs,
        fetchImpl: this.fetchImpl,
      });
    } finally {
      this.controllers.delete(controller);
      signal?.removeEventListener?.('abort', onAbort);
    }
  }

  async dispose() {
    for (const controller of this.controllers) {
      try {
        controller.abort();
      } catch {
        /* ignore */
      }
    }
    this.controllers.clear();
  }
}

export const XINGCHEN_PROVIDER_INFO = {
  id: XINGCHEN_PROVIDER_ID,
  name: 'XingChenASR-V3.2-Ultra (SiliconFlow)',
  languages: XINGCHEN_LANGUAGES,
  // 云端模型不需要下载，列表里也不会出现下载源与磁盘估算。
  downloadSources: [],
  // 非流式接口：每段都要走一次网络请求，实时转写的延迟明显高于录后整段转写。
  realtime: false,
  maxChunkSeconds: 50,
};

/**
 * 构造云端 provider。info.location 固定为 cloud，设置页据此隐藏「下载并准备」。
 * @param {object} [options]
 * @param {() => string} [options.getApiKey] 每次读取最新配置，保存密钥后无需重建 provider
 * @param {string} [options.baseUrl] 覆盖接口地址（默认官方地址，也接受 SILICONFLOW_BASE_URL）
 * @param {string} [options.model]
 * @param {typeof fetch} [options.fetchImpl] 测试注入
 * @param {number} [options.timeoutMs]
 */
export function createXingchenProvider(options = {}) {
  const preparation = new XingchenPreparation({
    getApiKey: typeof options.getApiKey === 'function' ? options.getApiKey : () => options.apiKey,
    baseUrl: normalizeXingchenBaseUrl(options.baseUrl || process.env.SILICONFLOW_BASE_URL),
    model: String(options.model || XINGCHEN_MODEL),
    fetchImpl: options.fetchImpl || globalThis.fetch,
    timeoutMs: Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : REQUEST_TIMEOUT_MS,
  });
  return {
    info: { location: 'cloud', ...XINGCHEN_PROVIDER_INFO },
    preparation,
    transcribe: (input, signal) => preparation.transcribe(input, signal),
    dispose: () => preparation.dispose(),
  };
}
