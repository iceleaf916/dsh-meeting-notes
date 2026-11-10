/**
 * 「会议记录」插件 Host 入口。
 *
 * 职责：
 *   - 用 Swift 辅助程序（recorder/）采集「系统音频 + 麦克风」并混音成 16k mono PCM；
 *   - 复用 DSH 内置的 SenseVoiceSmall (INT8) 本地识别服务做转写（实时 / 录后两种模式）；
 *   - 会议音频与文稿落在 storageDir（默认 ~/dsh-meetings）；
 *   - 点「生成会议纪要」时，把会议目录注册成 DSH 工作区并建一条会话，让模型写 minutes.md，
 *     客户端跳到该会话即可继续聊天；
 *   - 通过 /dsh-meeting-notes/* 的 HTTP 接口给前端提供状态、录音控制与会议数据。
 */

import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  DEFAULT_CONFIG,
  WavSink,
  createMeeting,
  deleteMeeting,
  ensureStorageDir,
  listMeetings,
  normalizeConfig,
  readMeetingByPath,
  readWavPcm,
  renderTranscript,
  storageStatus,
  writeMeeting,
} from './storage.js';
import { ensureRecorder, platformInfo, recorderState, startRecorder } from './capture.js';
import {
  RealtimeSegmenter,
  cancelPrepare,
  findProvider,
  isProviderReady,
  pickProvider,
  prepareProvider,
  providerCatalog,
  providerView,
  speechService,
  splitPcm,
  toWav,
  transcribeChunks,
} from './asr.js';
import { createMinutesRecord } from './minutes.js';
import { createQwen3Provider } from './qwen3.js';

export const inject = ['webServer'];

const PREFIX = '/dsh-meeting-notes';
const HEADER = 'x-dsh-meeting-notes';
const MAX_BODY = 64 * 1024;
const READY_TIMEOUT_MS = 30_000;
const PROVIDER_TIMEOUT_MS = 10 * 60_000;
const MEETING_ID_PATTERN = /^[0-9]{8}-[0-9]{6}-[0-9a-f]{4}$/;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.statusCode = status;
  }
}

function sendJson(res, value, status = 200) {
  if (!res || res.writableEnded) return;
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(value));
}

async function readJsonBody(req) {
  const type = String(req.headers['content-type'] || '').toLowerCase();
  if (!type.includes('application/json')) throw new HttpError(400, '请求格式错误');
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new HttpError(413, '请求内容过大');
    chunks.push(chunk);
  }
  if (!size) return {};
  try {
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('bad body');
    return body;
  } catch {
    throw new HttpError(400, '请求格式错误');
  }
}

/** 会议目录下的相对资源路径。 */
function parseMeetingPath(urlPath) {
  const marker = `${PREFIX}/meetings/`;
  if (!urlPath.startsWith(marker)) return null;
  const rest = urlPath.slice(marker.length);
  const parts = rest.split('/').filter(Boolean);
  const id = decodeURIComponent(parts.shift() || '');
  if (!MEETING_ID_PATTERN.test(id)) return null;
  return { id, sub: parts.join('/') };
}

export function apply(ctx, config = {}) {
  /** 原始插件配置；normalizeConfig 只保留运行字段，这里要读 Qwen3 的可选路径/线程数。 */
  const rawConfig = config && typeof config === 'object' ? config : {};
  let currentConfig = normalizeConfig(config, DEFAULT_CONFIG);
  /** 正在进行的录音；同一时间只允许一路。 */
  let recording = null;
  /** SSE 客户端响应对象集合。 */
  const eventClients = new Set();
  /** 后台转写任务：meetingId → Promise。 */
  const transcribeJobs = new Map();

  // ---- 可选服务延迟获取（冷启动时 configEditor / speechToText 可能还没激活） ----
  const configEditor = () => ctx.get('configEditor');
  const resolveEntry = () => {
    const own = ctx.fiber && ctx.fiber.entry;
    if (own) return own;
    const editor = configEditor();
    if (!editor) return undefined;
    try {
      return editor
        .entries()
        .find(
          (item) =>
            item.options?.id === 'dsh-meeting-notes' ||
            item.id === 'dsh-meeting-notes' ||
            String(item.id || '').endsWith(':dsh-meeting-notes'),
        );
    } catch {
      return undefined;
    }
  };

  const originAllowed = (req) => {
    const origin = req.headers.origin;
    let expected;
    try {
      expected = ctx.webServer.getOrigin();
    } catch {
      expected = undefined;
    }
    return !origin || !expected || origin === expected;
  };

  const writeAllowed = (req) => req.method === 'POST' && req.headers[HEADER] === '1';

  // ---- SSE ----
  const broadcast = (event) => {
    if (!eventClients.size) return;
    const payload = `data: ${JSON.stringify(event)}\n\n`;
    for (const res of eventClients) {
      try {
        res.write(payload);
      } catch {
        eventClients.delete(res);
      }
    }
  };

  // ---- 录音状态快照 ----
  function recordingPayload() {
    if (!recording) {
      return {
        active: false,
        meetingId: null,
        mode: null,
        startedAt: null,
        seconds: 0,
        level: 0,
        micLevel: 0,
        systemLevel: 0,
        statusText: '',
        partial: '',
        segments: [],
      };
    }
    return {
      active: true,
      meetingId: recording.meta.id,
      mode: recording.mode,
      startedAt: recording.meta.startedAt,
      seconds: Math.round(recording.wav.durationSec),
      level: recording.level,
      micLevel: recording.micLevel,
      systemLevel: recording.systemLevel,
      statusText: recording.statusText,
      partial: recording.partial,
      segments: recording.meta.segments.slice(-40),
    };
  }

  const broadcastState = () => broadcast({ type: 'state', recording: recordingPayload() });

  async function buildState() {
    const config = currentConfig;
    const platform = platformInfo();
    const storage = await storageStatus(config.storageDir);
    const service = speechService(ctx);
    const provider = pickProvider(service, config.providerId);
    const view = provider ? providerView(service, provider.id) : null;
    // 设置页的模型列表：直接来自 DSH 语音服务的 provider 注册表，未来新增模型自动出现。
    const models = providerCatalog(service, config.providerId);
    const meetings = await listMeetings(config.storageDir);
    const recorder = await recorderState();
    return {
      ok: true,
      platform: { supported: platform.supported, name: platform.name, reason: platform.reason },
      config,
      storage,
      provider: view,
      providerReady: isProviderReady(view),
      speechAvailable: !!service,
      models,
      recording: recordingPayload(),
      meetings,
      capabilities: { buildRecorder: platform.supported, recorderBuilt: recorder.built },
    };
  }

  // ---- 文稿落盘 ----
  async function writeTranscript(dir, meta) {
    const markdown = renderTranscript(meta, meta.segments || []);
    await fs.writeFile(path.join(dir, 'transcript.md'), markdown, 'utf8');
    return markdown;
  }

  // ---- 本地模型准备 ----
  async function waitProviderReady(service, providerId) {
    prepareProvider(service, providerId);
    const startedAt = Date.now();
    for (;;) {
      const view = providerView(service, providerId);
      if (isProviderReady(view)) return view;
      if (view && view.preparation && view.preparation.phase === 'failed') {
        throw new Error(`本地识别模型准备失败：${view.preparation.message || '未知原因'}`);
      }
      if (Date.now() - startedAt > PROVIDER_TIMEOUT_MS) {
        throw new Error('本地识别模型准备超时，请稍后重试');
      }
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  // ---- 整段转写（录后模式 / 重新转写） ----
  function startTranscription(meetingId) {
    const existing = transcribeJobs.get(meetingId);
    if (existing) return existing;

    const job = (async () => {
      const config = currentConfig;
      const found = await readMeetingByPath(config.storageDir, meetingId);
      const dir = found.dir;
      let meta = { ...found };
      delete meta.dir;
      meta.status = 'transcribing';
      meta.error = '';
      await writeMeeting(dir, meta);

      const service = speechService(ctx);
      if (!service) throw new Error('DSH 的本地语音识别服务未启用，请确认语音输入相关插件已开启');
      const provider = pickProvider(service, config.providerId);
      if (!provider) throw new Error('没有可用的本地语音识别服务');
      await waitProviderReady(service, provider.id);

      const pcm = await readWavPcm(path.join(dir, 'audio.wav'));
      if (!pcm.length) throw new Error('录音文件为空，无法转写');
      const chunks = splitPcm(pcm, {
        chunkSeconds: config.chunkSeconds,
        maxChunkSeconds: Number(provider.maxChunkSeconds) > 0 ? provider.maxChunkSeconds : 50,
      });
      const segments = await transcribeChunks(chunks, {
        service,
        providerId: provider.id,
        language: config.language,
        signal: new AbortController().signal,
        onSegment: (segment) => broadcast({ type: 'segment', ...segment }),
      });

      meta = { ...(await readMeetingByPath(config.storageDir, meetingId)) };
      delete meta.dir;
      meta.segments = segments;
      meta.providerId = provider.id;
      meta.status = 'transcribed';
      meta.error = '';
      await writeMeeting(dir, meta);
      await writeTranscript(dir, meta);
      return meta;
    })()
      .catch(async (error) => {
        const message = error instanceof Error ? error.message : String(error);
        try {
          const found = await readMeetingByPath(currentConfig.storageDir, meetingId);
          const dir = found.dir;
          const meta = { ...found, status: 'failed', error: message };
          delete meta.dir;
          await writeMeeting(dir, meta);
        } catch {
          /* 目录已不存在，忽略 */
        }
        broadcast({ type: 'error', message: `转写失败：${message}` });
        return null;
      })
      .finally(() => {
        transcribeJobs.delete(meetingId);
        broadcastState();
      });

    transcribeJobs.set(meetingId, job);
    return job;
  }

  // ---- 录音 ----
  async function startRecording({ title, mode }) {
    if (recording) throw new HttpError(409, '已有录音正在进行，请先停止或放弃');
    const platform = platformInfo();
    if (!platform.supported) throw new HttpError(400, platform.reason);

    const config = currentConfig;
    const service = speechService(ctx);
    if (!service) throw new HttpError(400, 'DSH 的本地语音识别服务未启用，请确认语音输入相关插件已开启');
    const provider = pickProvider(service, config.providerId);
    if (!provider) throw new HttpError(400, '没有可用的本地语音识别服务（SenseVoiceSmall）');
    const view = providerView(service, provider.id);
    if (!view || !isProviderReady(view)) {
      if (mode === 'realtime') {
        throw new HttpError(400, '实时转写需要本地模型先就绪，请到「设置 → 识别模型」下载并准备好模型');
      }
      // 录后转写：录音期间在后台把模型准备好，停止时就不必再等下载。
      prepareProvider(service, provider.id);
    }

    await ensureRecorder();
    await ensureStorageDir(config.storageDir);

    const created = await createMeeting(config.storageDir, {
      title: String(title || '').trim(),
      mode: mode === 'realtime' ? 'realtime' : 'after',
      language: config.language,
      providerId: provider.id,
    });
    const wav = await new WavSink(path.join(created.dir, 'audio.wav')).open();

    const session = {
      id: created.id,
      dir: created.dir,
      meta: created.meta,
      mode: created.meta.mode,
      wav,
      recorder: null,
      level: 0,
      micLevel: 0,
      systemLevel: 0,
      partial: '',
      statusText: '正在启动录音…',
      segmenter: null,
      previewTimer: null,
      previewBusy: false,
      bytes: 0,
    };

    if (session.mode === 'realtime') {
      // Qwen3 这类非流式模型的单次推理窗口有限（约 30 秒），切块不能超过 provider 的上限。
      const providerCap = Number(provider.maxChunkSeconds);
      session.segmenter = new RealtimeSegmenter({
        chunkSeconds: providerCap > 0 ? Math.min(config.chunkSeconds, providerCap) : config.chunkSeconds,
        onChunk: (chunk) => handleRealtimeChunk(session, chunk),
      });
    }

    recording = session;
    broadcastState();

    try {
      session.recorder = startRecorder({
        captureSystemAudio: config.captureSystemAudio,
        captureMicrophone: config.captureMicrophone,
        onPcm: (chunk) => {
          session.wav.write(chunk);
          if (session.segmenter) session.segmenter.push(chunk);
        },
        onSignal: (signal) => {
          if (signal.type === 'ready') {
            session.statusText = '';
            broadcastState();
          } else if (signal.type === 'level') {
            session.systemLevel = Number(signal.system) || 0;
            session.micLevel = Number(signal.mic) || 0;
            session.level = Number(signal.rms) || Math.max(session.systemLevel, session.micLevel);
            broadcast({
              type: 'level',
              seconds: Math.round(session.wav.durationSec),
              level: session.level,
              micLevel: session.micLevel,
              systemLevel: session.systemLevel,
            });
          } else if (signal.type === 'error') {
            session.statusText = signal.message || '录音出错';
            broadcast({ type: 'error', message: session.statusText });
          }
        },
        onExit: ({ code, signal }) => {
          if (recording === session) {
            session.statusText = `录音进程已退出（code=${code} signal=${signal}），请点停止以保存`;
          }
        },
      });

      await withTimeout(session.recorder.ready, READY_TIMEOUT_MS, '录音启动超时');
      session.recorder.child.stdin.on('error', () => {});
      session.statusText = '';

      if (session.mode === 'realtime') {
        session.previewTimer = setInterval(() => runRealtimePreview(session), 3500);
        session.previewTimer.unref?.();
      }
      broadcastState();
      return { meetingId: session.id, startedAt: session.meta.startedAt, mode: session.mode };
    } catch (error) {
      recording = null;
      try {
        session.recorder?.kill();
      } catch {
        /* ignore */
      }
      if (session.previewTimer) clearInterval(session.previewTimer);
      await wav.close().catch(() => {});
      await deleteMeeting(config.storageDir, created.id).catch(() => {});
      const message = error instanceof Error ? error.message : String(error);
      throw new HttpError(
        400,
        `${message}\n如果提示没有权限，请到「系统设置 → 隐私与安全性」给 DeepSeek Harness 开启「屏幕录制」（采系统音频）和「麦克风」权限，然后重启 DSH。`,
      );
    }
  }

  async function handleRealtimeChunk(session, { pcm, offsetSec, durationSec }) {
    const service = speechService(ctx);
    if (!service) return;
    try {
      const spec = service.resolve({
        audio: new Uint8Array(toWav(pcm)),
        providerId: session.meta.providerId,
        language: session.meta.language,
      });
      const transcript = await service.transcribe(spec, new AbortController().signal);
      const text = String(transcript?.text || '').trim();
      if (!text) return;
      const segment = {
        fromSec: Math.round(offsetSec),
        toSec: Math.round(offsetSec + (transcript?.audioSeconds || durationSec)),
        text,
      };
      session.meta.segments.push(segment);
      session.partial = '';
      broadcast({ type: 'partial', text: '', fromSec: segment.toSec, toSec: segment.toSec });
      broadcast({ type: 'segment', ...segment, index: session.meta.segments.length - 1 });
      const meta = { ...session.meta, durationSec: Math.round(session.wav.durationSec) };
      await writeMeeting(session.dir, meta);
      await writeTranscript(session.dir, meta);
    } catch (error) {
      broadcast({
        type: 'error',
        message: `实时转写失败：${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  /** 实时模式的「边说边出字」：用缓冲区的音频跑一次预览识别，不消费缓冲。 */
  async function runRealtimePreview(session) {
    if (recording !== session || session.previewBusy || !session.segmenter) return;
    if (session.segmenter.bufferedSeconds < 3) return;
    const pcm = session.segmenter.bufferedPcm(config.chunkSeconds);
    if (!pcm || pcm.length < 48000) return;
    const service = speechService(ctx);
    if (!service) return;
    session.previewBusy = true;
    try {
      const spec = service.resolve({
        audio: new Uint8Array(toWav(pcm)),
        providerId: session.meta.providerId,
        language: session.meta.language,
      });
      const transcript = await service.transcribe(spec, new AbortController().signal);
      const text = String(transcript?.text || '').trim();
      if (text && recording === session) {
        session.partial = text;
        const fromSec = Math.round(session.segmenter.flushedSeconds);
        broadcast({ type: 'partial', text, fromSec, toSec: Math.round(session.segmenter.seconds) });
      }
    } catch {
      /* 预览失败不打扰录音，正式分段还会再转一次 */
    } finally {
      session.previewBusy = false;
    }
  }

  async function stopRecording() {
    const session = recording;
    if (!session) throw new HttpError(409, '当前没有正在进行的录音');
    recording = null;
    if (session.previewTimer) clearInterval(session.previewTimer);

    try {
      await session.recorder?.stop();
    } catch {
      session.recorder?.kill();
    }
    await session.wav.close();
    session.meta.durationSec = Math.round(session.wav.durationSec);
    session.meta.endedAt = new Date().toISOString();

    if (session.segmenter) {
      await session.segmenter.finish();
    }
    session.partial = '';

    if (session.mode === 'after') {
      session.meta.status = 'transcribing';
      await writeMeeting(session.dir, session.meta);
      await writeTranscript(session.dir, {
        ...session.meta,
        segments: session.meta.segments || [],
      });
      startTranscription(session.id);
    } else {
      session.meta.status = 'transcribed';
      await writeMeeting(session.dir, session.meta);
      await writeTranscript(session.dir, session.meta);
    }

    broadcastState();
    return {
      meetingId: session.id,
      durationSec: session.meta.durationSec,
      status: session.meta.status,
    };
  }

  async function cancelRecording() {
    const session = recording;
    if (!session) throw new HttpError(409, '当前没有正在进行的录音');
    recording = null;
    if (session.previewTimer) clearInterval(session.previewTimer);
    try {
      await session.recorder?.stop();
    } catch {
      session.recorder?.kill();
    }
    await session.wav.close().catch(() => {});
    await deleteMeeting(currentConfig.storageDir, session.id).catch(() => {});
    broadcastState();
    return { meetingId: session.id };
  }

  // ---- 配置 ----
  async function saveConfig(patch) {
    const next = normalizeConfig({ ...currentConfig, ...patch }, currentConfig);
    // 模型选择必须指向 DSH 语音服务真实注册的 provider，避免把配置写成不存在的 id。
    if (patch.providerId) {
      const service = speechService(ctx);
      if (service && !findProvider(service, next.providerId)) {
        throw new HttpError(400, `没有可用的本地语音识别服务（${next.providerId}）`);
      }
    }
    const editor = configEditor();
    const entry = resolveEntry();
    if (!editor || !entry) throw new HttpError(400, '当前 profile 不支持保存插件配置');
    await editor.edit(entry, (cur) => ({
      ...cur,
      storageDir: next.storageDir,
      transcribeMode: next.transcribeMode,
      language: next.language,
      providerId: next.providerId,
      captureSystemAudio: next.captureSystemAudio,
      captureMicrophone: next.captureMicrophone,
      chunkSeconds: next.chunkSeconds,
    }));
    currentConfig = next;
    return next;
  }

  const CONFIG_KEYS = new Set([
    'storageDir',
    'transcribeMode',
    'language',
    'providerId',
    'captureSystemAudio',
    'captureMicrophone',
    'chunkSeconds',
  ]);

  // ---- 路由 ----
  const guard = (handler) => async (req, res) => {
    try {
      if (!originAllowed(req)) {
        sendJson(res, { ok: false, error: 'forbidden' }, 403);
        return;
      }
      await handler(req, res);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = error && error.statusCode ? error.statusCode : 500;
      if (error && !error.statusCode) console.error('[dsh-meeting-notes]', error);
      sendJson(res, { ok: false, error: message }, status);
    }
  };

  const requireGet = (req) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, '仅支持 GET');
  };

  const requireWrite = (req) => {
    if (req.method !== 'POST') throw new HttpError(405, '仅支持 POST');
    if (!writeAllowed(req)) throw new HttpError(403, 'forbidden');
  };

  const routes = [
    {
      kind: 'exact',
      path: `${PREFIX}/state`,
      handler: async (req, res) => {
        requireGet(req);
        sendJson(res, await buildState());
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/config`,
      handler: async (req, res) => {
        requireWrite(req);
        const body = await readJsonBody(req);
        const patch = {};
        for (const [key, value] of Object.entries(body)) {
          if (CONFIG_KEYS.has(key)) patch[key] = value;
        }
        if (!Object.keys(patch).length) throw new HttpError(400, '没有可保存的配置项');
        const config = await saveConfig(patch);
        sendJson(res, { ok: true, config, storage: await storageStatus(config.storageDir) });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/prepare`,
      handler: async (req, res) => {
        requireWrite(req);
        const service = speechService(ctx);
        if (!service) throw new HttpError(400, 'DSH 的本地语音识别服务未启用');
        const body = await readJsonBody(req);
        const requested = String(body.providerId || '').trim();
        const provider = requested ? findProvider(service, requested) : pickProvider(service, currentConfig.providerId);
        if (!provider) {
          throw new HttpError(400, requested ? `没有可用的本地语音识别服务（${requested}）` : '没有可用的本地语音识别服务');
        }
        const source = String(body.downloadSource || '').trim();
        let options;
        if (source && source !== 'auto') {
          const sources = Array.isArray(provider.downloadSources) ? provider.downloadSources : [];
          if (sources.length && !sources.includes(source)) throw new HttpError(400, '不支持的模型下载来源');
          options = { downloadSource: source };
        }
        prepareProvider(service, provider.id, options);
        sendJson(res, { ok: true, providerId: provider.id });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/prepare/cancel`,
      handler: async (req, res) => {
        requireWrite(req);
        const service = speechService(ctx);
        if (!service) throw new HttpError(400, 'DSH 的本地语音识别服务未启用');
        const body = await readJsonBody(req);
        const providerId = String(body.providerId || currentConfig.providerId || '').trim();
        const provider = findProvider(service, providerId);
        if (!provider) throw new HttpError(400, `没有可用的本地语音识别服务（${providerId}）`);
        if (typeof service.cancelPreparation !== 'function') {
          throw new HttpError(400, '当前语音服务不支持取消模型准备');
        }
        await cancelPrepare(service, provider.id);
        sendJson(res, { ok: true, providerId: provider.id });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/recordings`,
      handler: async (req, res) => {
        requireWrite(req);
        const body = await readJsonBody(req);
        const result = await startRecording({
          title: body.title,
          mode: body.mode,
        });
        sendJson(res, { ok: true, ...result });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/recordings/stop`,
      handler: async (req, res) => {
        requireWrite(req);
        const result = await stopRecording();
        sendJson(res, { ok: true, ...result });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/recordings/cancel`,
      handler: async (req, res) => {
        requireWrite(req);
        await cancelRecording();
        sendJson(res, { ok: true });
      },
    },
    {
      kind: 'exact',
      path: `${PREFIX}/recordings/events`,
      handler: async (req, res) => {
        requireGet(req);
        res.statusCode = 200;
        res.setHeader('content-type', 'text/event-stream; charset=utf-8');
        res.setHeader('cache-control', 'no-store');
        res.setHeader('connection', 'keep-alive');
        res.write(': connected\n\n');
        res.write(`data: ${JSON.stringify({ type: 'state', recording: recordingPayload() })}\n\n`);
        eventClients.add(res);
        res.on('close', () => eventClients.delete(res));
      },
    },
    {
      kind: 'prefix',
      path: `${PREFIX}/meetings`,
      handler: async (req, res) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const parsed = parseMeetingPath(url.pathname);
        if (!parsed) throw new HttpError(404, '会议不存在');
        const { id, sub } = parsed;
        const config = currentConfig;

        if (!sub) {
          if (req.method === 'DELETE') {
            if (recording && recording.meta.id === id) throw new HttpError(409, '该会议正在录音，无法删除');
            requireDelete(req);
            await deleteMeeting(config.storageDir, id);
            broadcastState();
            sendJson(res, { ok: true });
            return;
          }
          requireGet(req);
          const found = await readMeetingByPath(config.storageDir, id);
          const dir = found.dir;
          const meta = { ...found };
          delete meta.dir;
          const transcript = await fs
            .readFile(path.join(dir, 'transcript.md'), 'utf8')
            .catch(() => '');
          const minutes = await fs.readFile(path.join(dir, 'minutes.md'), 'utf8').catch(() => '');
          const audio = await fs
            .stat(path.join(dir, 'audio.wav'))
            .then((stat) => ({ exists: true, sizeBytes: stat.size }))
            .catch(() => ({ exists: false, sizeBytes: 0 }));
          sendJson(res, { ok: true, meeting: { ...meta, audio }, transcript, minutes });
          return;
        }

        if (sub === 'audio') {
          requireGet(req);
          const file = path.join(config.storageDir, id, 'audio.wav');
          await streamWav(req, res, file);
          return;
        }

        if (sub === 'transcribe') {
          requireWrite(req);
          const found = await readMeetingByPath(config.storageDir, id);
          delete found.dir;
          startTranscription(id);
          sendJson(res, { ok: true, status: 'transcribing' });
          return;
        }

        if (sub === 'minutes') {
          requireWrite(req);
          const found = await readMeetingByPath(config.storageDir, id);
          delete found.dir;
          const transcriptPath = path.join(config.storageDir, id, 'transcript.md');
          const transcript = await fs.readFile(transcriptPath, 'utf8').catch(() => '');
          if (!String(transcript).trim()) {
            throw new HttpError(400, '还没有转写文稿，无法生成会议纪要');
          }
          const record = await createMinutesRecord(ctx, {
            storageDir: config.storageDir,
            meta: found,
          });
          sendJson(res, { ok: true, ...record });
          return;
        }

        throw new HttpError(404, '未知操作');
      },
    },
  ];

  // 在 DSH 的 speechToText 服务上注册本插件自带的 Qwen3-ASR provider。
  // 之所以由插件注册：DSH 目前内置的 provider 只有 SenseVoice，模型列表要能切换就需要
  // speechToText 上存在第二个 provider；服务出现/卸载由 cordis 的 inject 生命周期管理。
  ctx.inject(['speechToText'], (speechCtx) => {
    // 注册失败（例如原生 ONNX 运行时不可用）只降级为「没有 Qwen3 可切换」，
    // 不能让整个会议记录插件跟着挂掉。
    try {
      const provider = createQwen3Provider({
        modelRoot:
          typeof rawConfig.qwen3ModelDir === 'string' && rawConfig.qwen3ModelDir ? rawConfig.qwen3ModelDir : undefined,
        threads: Number(rawConfig.qwen3Threads) > 0 ? Number(rawConfig.qwen3Threads) : undefined,
      });
      speechCtx.effect(() => speechCtx.speechToText.register(provider));
      speechCtx.effect(() => () => provider.dispose());
    } catch (error) {
      console.error('[dsh-meeting-notes] 注册 Qwen3-ASR provider 失败：', error);
    }
  });

  ctx.effect(() => {
    const disposers = routes.map((route) =>
      ctx.webServer.register({ kind: route.kind, path: route.path, handler: guard(route.handler) }),
    );
    return () => {
      for (const dispose of disposers) dispose();
    };
  });

  // SSE 心跳：15 秒一次，避免中间代理掐断长连接。
  ctx.effect(() => {
    const timer = setInterval(() => {
      for (const res of eventClients) {
        try {
          res.write(': ping\n\n');
        } catch {
          eventClients.delete(res);
        }
      }
    }, 15_000);
    timer.unref?.();
    return () => {
      clearInterval(timer);
      for (const res of eventClients) {
        try {
          res.end();
        } catch {
          /* ignore */
        }
      }
      eventClients.clear();
    };
  });

  // 插件卸载时收尾：停止录音进程、关闭 SSE。
  ctx.effect(() => () => {
    const session = recording;
    recording = null;
    if (session) {
      if (session.previewTimer) clearInterval(session.previewTimer);
      try {
        session.recorder?.kill();
      } catch {
        /* ignore */
      }
      session.wav.close().catch(() => {});
    }
  });
}

function requireDelete(req) {
  if (req.method !== 'DELETE') throw new HttpError(405, '仅支持 DELETE');
  // 与写请求一致：带自定义头才算来自插件页面，挡住跨站简单请求。
  if (req.headers[HEADER] !== '1') throw new HttpError(403, 'forbidden');
}

async function streamWav(req, res, file) {
  let stat;
  try {
    stat = await fs.stat(file);
  } catch {
    throw new HttpError(404, '录音文件不存在');
  }
  if (!stat.size) throw new HttpError(404, '录音文件为空');
  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(String(range).trim());
    if (!match) throw new HttpError(416, 'Range 不合法');
    let start = match[1] ? Number(match[1]) : 0;
    let end = match[2] ? Number(match[2]) : stat.size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= stat.size) {
      throw new HttpError(416, 'Range 不合法');
    }
    end = Math.min(end, stat.size - 1);
    res.statusCode = 206;
    res.setHeader('content-type', 'audio/wav');
    res.setHeader('accept-ranges', 'bytes');
    res.setHeader('content-range', `bytes ${start}-${end}/${stat.size}`);
    res.setHeader('content-length', end - start + 1);
    createReadStream(file, { start, end }).pipe(res);
    return;
  }
  res.statusCode = 200;
  res.setHeader('content-type', 'audio/wav');
  res.setHeader('accept-ranges', 'bytes');
  res.setHeader('content-length', stat.size);
  createReadStream(file).pipe(res);
}

function withTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
