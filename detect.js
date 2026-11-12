/**
 * 会议检测状态机与提醒控制器。
 *
 * 分工：
 *   - recorder/detector.swift（Swift）只负责采样：每 500ms 报告「腾讯会议进程此刻
 *     是否占用麦克风 / 输出音频，是否有窗口」；
 *   - DetectionStateMachine 负责去抖：音频持续 2s 才算会议开始，音频消失持续 12s
 *     才算会议结束（客户端切歌/短暂静音不会误判）；
 *   - createMeetingDetector 负责产品逻辑：什么时候弹「开始记录 / 结束记录」建议、
 *     用户忽略后的冷却、建议过期、把用户选择转成录音动作，以及检测进程的启动/重启。
 *
 * 这里刻意不碰 HTTP 与 UI：Host（index.js）只负责路由和 SSE 广播，客户端只负责
 * 渲染卡片与系统通知。状态机可以脱离进程单独测试（test/detect.test.mjs）。
 */

import { randomBytes } from 'node:crypto';

import { defaultTitle } from './storage.js';

/**
 * 支持的会议客户端。检测进程按 bundle 前缀 / 可执行路径匹配，
 * 匹配到之后用这里的 id / name 告诉界面「是哪个客户端在开会」。
 *
 * - 腾讯会议：国内版 com.tencent.meeting*，国际版 com.tencent.wemeet*；
 * - 企业微信内置会议：企业微信把会议放在独立子进程 wwmapp
 *   （bundle `com.tencent.wwmapp`，进程显示名「企业微信·会议」）里跑，
 *   所以只匹配企业微信主进程 com.tencent.WeWorkMac 是抓不到的，而且主进程
 *   还会因为语音消息/语音通话占用音频，容易误判。
 */
export const DETECT_APPS = [
  {
    id: 'tencent-meeting',
    name: '腾讯会议',
    bundlePrefixes: ['com.tencent.meeting', 'com.tencent.wemeet'],
    pathHints: ['/TencentMeeting.app/', '/WeMeeting.app/'],
  },
  {
    id: 'wecom-meeting',
    name: '企业微信会议',
    bundlePrefixes: ['com.tencent.wwmapp'],
    pathHints: ['/企业微信.app/Contents/Frameworks/wwmapp.app/', '/WeCom.app/Contents/Frameworks/wwmapp.app/'],
  },
];

/** 传给 Swift detector 的 bundle 前缀。 */
export const DETECT_TARGETS = [...new Set(DETECT_APPS.flatMap((app) => app.bundlePrefixes))];
/** 未识别到具体客户端时的兜底展示名（兼容旧调用方）。 */
export const DETECT_APP_NAME = DETECT_APPS[0].name;

function appIdentity(sampleApp) {
  const bundle = String((sampleApp && sampleApp.bundle) || '');
  const executable = String((sampleApp && sampleApp.executable) || '');
  const match = DETECT_APPS.find(
    (app) =>
      app.bundlePrefixes.some((prefix) => bundle === prefix || bundle.startsWith(prefix + '.')) ||
      app.pathHints.some((hint) => executable.includes(hint)),
  );
  return match || DETECT_APPS[0];
}
/** 采样间隔：越小越灵敏，但 Swift 侧每轮要枚举 CoreAudio 进程对象。 */
const SAMPLE_INTERVAL_MS = 500;
/** 开始建议 10 分钟后自动失效；结束建议 5 分钟。 */
const START_SUGGESTION_TTL_MS = 10 * 60 * 1000;
const END_SUGGESTION_TTL_MS = 5 * 60 * 1000;
/** 检测进程异常退出后的重试次数与间隔。 */
const MAX_RESTARTS = 3;
const RESTART_DELAY_MS = 5000;

function detectError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function clampSeconds(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

/**
 * 纯状态机：只吃「这一刻腾讯会议是否在收发音频」，输出 started / ended 两个事件。
 * 时间戳全部由调用方传入，测试里可以任意拨钟。
 */
export class DetectionStateMachine {
  constructor({ sustainMs = 2000, graceMs = 12000 } = {}) {
    this.sustainMs = Math.max(0, Number(sustainMs) || 0);
    this.graceMs = Math.max(0, Number(graceMs) || 0);
    this.reset();
  }

  reset() {
    this.inMeeting = false;
    this.candidateSince = null;
    this.absentSince = null;
    this.startedAt = 0;
  }

  /**
   * @param {{input?: boolean, output?: boolean}} sample
   * @param {number} at epoch ms
   * @returns {'started' | 'ended' | null}
   */
  update(sample, at) {
    const active = Boolean(sample && (sample.input || sample.output));
    // 窗口存在与否不参与判定：会议结束后主窗口可能还开着，但音频流已经停了。
    if (!this.inMeeting) {
      if (!active) {
        this.candidateSince = null;
        return null;
      }
      if (this.candidateSince === null) this.candidateSince = at;
      if (at - this.candidateSince < this.sustainMs) return null;
      this.inMeeting = true;
      this.startedAt = this.candidateSince;
      this.absentSince = null;
      return 'started';
    }

    if (active) {
      this.absentSince = null;
      return null;
    }
    if (this.absentSince === null) this.absentSince = at;
    if (at - this.absentSince < this.graceMs) return null;
    this.inMeeting = false;
    this.candidateSince = null;
    this.absentSince = null;
    this.startedAt = 0;
    return 'ended';
  }
}

/**
 * 创建检测运行时。对外方法：
 *   start()              启动检测进程（幂等；配置关闭时不会启动）
 *   stop()               停止检测进程并清空状态
 *   applyConfig()        配置变更后调用：按开关启停，并刷新快照
 *   refresh()            仅刷新快照（例如通知开关变了）
 *   snapshot()           /state 与 /detect 用的检测快照
 *   ack(id, accept)      处理用户对建议的选择；接受时直接执行录音开始/停止
 *   notifyRecordingStarted() / notifyRecordingStopped()  手动录音时清掉过时的建议
 *   dispose()            插件卸载时收尾
 *
 * detectorApi / platform 可注入（测试用）；默认在真正启动时才动态加载 detector.js，
 * 这样纯状态机/控制器测试不需要先编译 Swift。
 */
export function createMeetingDetector({
  getConfig,
  isRecording,
  startRecording,
  stopRecording,
  onDetectChange,
  titleFor = defaultTitle,
  getRecordingTitle = () => '',
  log = () => {},
  detectorApi = null,
  platform = process.platform,
  now = () => Date.now(),
} = {}) {
  const readConfig = () => (typeof getConfig === 'function' ? getConfig() || {} : {});
  const readRecording = () => (typeof isRecording === 'function' ? Boolean(isRecording()) : false);
  const emit = () => {
    if (typeof onDetectChange === 'function') onDetectChange(snapshot());
  };

  const sustainMs = () =>
    clampSeconds(readConfig().detectStartSustainSeconds, 2, 1, 10) * 1000;
  const graceMs = () => clampSeconds(readConfig().detectEndGraceSeconds, 12, 5, 60) * 1000;
  const cooldownMs = () =>
    clampSeconds(readConfig().detectCooldownMinutes, 30, 1, 180) * 60 * 1000;

  let machine = new DetectionStateMachine({ sustainMs: sustainMs(), graceMs: graceMs() });

  let running = false;
  let error = '';
  let inMeeting = false;
  let since = null;
  let app = '';
  let appName = '';
  let suggestion = null;
  let suggestionTimer = null;
  let cooldownUntil = 0;
  let wants = false;
  let starting = null;
  let child = null;
  let retryTimer = null;
  let retries = 0;
  let disposed = false;

  function clearSuggestion() {
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
      suggestionTimer = null;
    }
    suggestion = null;
  }

  function publicSuggestion() {
    if (!suggestion) return null;
    return {
      id: suggestion.id,
      kind: suggestion.kind,
      app: suggestion.app,
      appName: suggestion.appName,
      title: suggestion.title,
      createdAt: suggestion.createdAt,
      expiresAt: suggestion.expiresAt,
    };
  }

  function snapshot() {
    const enabled = readConfig().detectEnabled !== false;
    return {
      enabled,
      available: platform === 'darwin',
      running,
      inMeeting,
      app: inMeeting ? app : '',
      appName: inMeeting ? appName : '',
      since,
      error,
      cooldownUntil: cooldownUntil ? new Date(cooldownUntil).toISOString() : null,
      suggestion: publicSuggestion(),
    };
  }

  function scheduleExpiry() {
    if (!suggestion) return;
    if (suggestionTimer) clearTimeout(suggestionTimer);
    const id = suggestion.id;
    const expiresAt = Date.parse(suggestion.expiresAt);
    const delay = Math.max(0, expiresAt - now());
    suggestionTimer = setTimeout(() => {
      suggestionTimer = null;
      if (!suggestion || suggestion.id !== id) return;
      const kind = suggestion.kind;
      clearSuggestion();
      // 开始建议被无视：冷却一段时间，避免同一场会反复打扰。
      if (kind === 'start') {
        cooldownUntil = now() + cooldownMs();
      }
      emit();
    }, delay);
    suggestionTimer.unref?.();
  }

  function createSuggestion(kind, at) {
    if (readConfig().detectEnabled === false) return;
    if (kind === 'start') {
      if (readRecording()) return;
      if (at < cooldownUntil) return;
    } else if (!readRecording()) {
      return;
    }
    if (suggestion && suggestion.kind === kind) return;

    const expiresIn = kind === 'start' ? START_SUGGESTION_TTL_MS : END_SUGGESTION_TTL_MS;
    const title = kind === 'start' ? String(titleFor(new Date(at)) || '') : String(getRecordingTitle() || '');
    const next = {
      id: randomBytes(4).toString('hex'),
      kind,
      app: app || DETECT_APPS[0].id,
      appName: appName || DETECT_APPS[0].name,
      title,
      createdAt: new Date(at).toISOString(),
      expiresAt: new Date(at + expiresIn).toISOString(),
    };
    clearSuggestion();
    suggestion = next;
    scheduleExpiry();
    emit();
  }

  function handleSample(sample) {
    if (!sample || typeof sample !== 'object') return;
    const at = Number(sample.at) || now();
    const apps = Array.isArray(sample.apps) ? sample.apps : [];
    const active = apps.find((item) => item && (item.input || item.output));
    const transition = machine.update(
      { input: Boolean(active && active.input), output: Boolean(active && active.output) },
      at,
    );

    if (transition === 'started') {
      const identity = appIdentity(active);
      inMeeting = true;
      app = identity.id;
      appName = identity.name;
      since = new Date(machine.startedAt || at).toISOString();
      createSuggestion('start', at);
      emit();
      return;
    }

    if (transition === 'ended') {
      inMeeting = false;
      since = null;
      // 保留 app / appName：结束建议里仍要写清是哪个客户端。
      // 会议已经结束，还挂着的「开始记录」建议就过期了。
      if (suggestion && suggestion.kind === 'start') clearSuggestion();
      createSuggestion('end', at);
      emit();
    }
  }

  function handleRuntimeError(message) {
    const text = String(message || '会议检测出错');
    error = text;
    log(text);
    // 检测进程挂了：清掉所有「在会中」的推断，避免残留建议。
    running = false;
    machine.reset();
    inMeeting = false;
    since = null;
    app = '';
    appName = '';
    clearSuggestion();
    emit();
    scheduleRestart();
  }

  function scheduleRestart() {
    if (!wants || disposed || retryTimer) return;
    if (retries >= MAX_RESTARTS) {
      error = '会议检测进程无法启动，请确认 Xcode 命令行工具可用后重启 DSH';
      emit();
      return;
    }
    retries += 1;
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void start();
    }, RESTART_DELAY_MS);
    retryTimer.unref?.();
  }

  async function start() {
    if (disposed) return;
    wants = true;
    if (readConfig().detectEnabled === false) {
      running = false;
      emit();
      return;
    }
    if (platform !== 'darwin') {
      error = '当前平台暂不支持会议检测（需要 macOS 14.2+）';
      running = false;
      emit();
      return;
    }
    if (starting) return starting;
    if (child) {
      running = true;
      emit();
      return;
    }

    starting = (async () => {
      try {
        const api = detectorApi || (await import('./detector.js'));
        await api.ensureDetector();
        if (!wants || disposed) return;
        const started = api.startDetector({
          intervalMs: SAMPLE_INTERVAL_MS,
          targets: DETECT_TARGETS,
          onSample: (sample) => handleSample(sample),
          onError: (message) => {
            error = String(message || '会议检测出错');
            log(error);
            emit();
          },
          onExit: ({ code, signal } = {}) => {
            child = null;
            if (!wants || disposed) return;
            handleRuntimeError(`会议检测进程已退出（code=${code} signal=${signal}）`);
          },
        });
        child = started;
        // stop() 可能发生在 startDetector 与 ready 之间：此时不能把子进程留在后台。
        if (!wants || disposed) {
          child = null;
          try {
            started.kill();
          } catch {
            /* ignore */
          }
          return;
        }
        started.ready.then(
          () => {
            if (!wants || disposed) return;
            running = true;
            error = '';
            retries = 0;
            machine.reset();
            inMeeting = false;
            since = null;
            emit();
          },
          (failure) => {
            child = null;
            handleRuntimeError(failure instanceof Error ? failure.message : String(failure));
          },
        );
      } catch (failure) {
        handleRuntimeError(failure instanceof Error ? failure.message : String(failure));
      } finally {
        starting = null;
      }
    })();
    return starting;
  }

  async function stop() {
    wants = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    const current = child;
    child = null;
    running = false;
    machine.reset();
    inMeeting = false;
    since = null;
    app = '';
    appName = '';
    error = '';
    clearSuggestion();
    if (current) {
      try {
        await current.stop();
      } catch {
        try {
          current.kill();
        } catch {
          /* ignore */
        }
      }
    }
    emit();
  }

  function applyConfig() {
    const enabled = readConfig().detectEnabled !== false;
    // 去抖/宽限期只在配置层可调（UI 不暴露）；改了参数就重建状态机，
    // 否则运行中的进程会一直用创建时的旧值。
    const nextSustain = sustainMs();
    const nextGrace = graceMs();
    if (machine.sustainMs !== nextSustain || machine.graceMs !== nextGrace) {
      machine = new DetectionStateMachine({ sustainMs: nextSustain, graceMs: nextGrace });
      inMeeting = false;
      since = null;
      app = '';
      appName = '';
      clearSuggestion();
    }
    if (!enabled) {
      if (wants || child || retryTimer) void stop();
      else emit();
      return;
    }
    if (!wants && !child) void start();
    else emit();
  }

  function notifyRecordingStarted() {
    if (suggestion && suggestion.kind === 'start') {
      clearSuggestion();
      emit();
    }
  }

  function notifyRecordingStopped() {
    if (suggestion && suggestion.kind === 'end') {
      clearSuggestion();
      emit();
    }
  }

  async function ack(id, accept) {
    const at = now();
    const current = suggestion;
    if (!current || current.id !== String(id || '')) {
      throw detectError('提醒已失效或已被处理', 409);
    }
    if (at >= Date.parse(current.expiresAt)) {
      clearSuggestion();
      emit();
      throw detectError('提醒已过期', 409);
    }

    if (!accept) {
      const kind = current.kind;
      clearSuggestion();
      if (kind === 'start') cooldownUntil = at + cooldownMs();
      emit();
      return { action: 'ignored' };
    }

    if (current.kind === 'start') {
      const title = current.title;
      await startRecording({ title, mode: String(readConfig().transcribeMode || 'after') });
      clearSuggestion();
      emit();
      return { action: 'start' };
    }

    await stopRecording();
    clearSuggestion();
    emit();
    return { action: 'stop' };
  }

  function dispose() {
    disposed = true;
    wants = false;
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    if (suggestionTimer) {
      clearTimeout(suggestionTimer);
      suggestionTimer = null;
    }
    const current = child;
    child = null;
    if (current) {
      try {
        current.kill();
      } catch {
        /* ignore */
      }
    }
  }

  return {
    start,
    stop,
    applyConfig,
    refresh: emit,
    snapshot,
    ack,
    notifyRecordingStarted,
    notifyRecordingStopped,
    dispose,
    // 测试/诊断用：直接注入一次采样。
    handleSample,
  };
}
