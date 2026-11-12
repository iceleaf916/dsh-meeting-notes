// 视觉预览（开发用）：把 MainPage 用真实 React + jsdom 渲染成静态 HTML，注入近似 DSH 主题变量，
// 供无头 Chrome 截图检查排版。用法：cd dsh-meeting-notes/test && node preview.mjs [outDir]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const HOME = process.env.HOME || '/Users/you';

const outDir = process.argv[2] || '/tmp/mn-preview';
mkdirSync(outDir, { recursive: true });

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://127.0.0.1:59699/',
  pretendToBeVisual: true,
});
const { window } = dom;
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true });
globalThis.HTMLElement = window.HTMLElement;
globalThis.Element = window.Element;
globalThis.Node = window.Node;
globalThis.localStorage = window.localStorage;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = (cb) => window.setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => window.clearTimeout(id);
process.env.IS_REACT_ACT_ENVIRONMENT = 'true';

const meetings = [
  {
    id: '20261110-134626-6586',
    title: '版本收敛方案讨论',
    startedAt: '2026-11-10T05:46:26.784Z',
    durationSec: 1524,
    mode: 'after',
    language: 'zh',
    status: 'transcribed',
    transcriptChars: 4210,
    hasMinutes: true,
    sizeBytes: 48771000,
    error: '',
  },
  {
    id: '20261110-091204-a1b2',
    title: '周会 · Web 研发一部',
    startedAt: '2026-11-10T01:12:04.000Z',
    durationSec: 2712,
    mode: 'realtime',
    language: 'zh',
    status: 'transcribed',
    transcriptChars: 9800,
    hasMinutes: false,
    sizeBytes: 86784000,
    error: '',
  },
  {
    id: '20261109-173300-c3d4',
    title: '客户端交付节奏对齐',
    startedAt: '2026-11-09T09:33:00.000Z',
    durationSec: 968,
    mode: 'after',
    language: 'zh',
    status: 'transcribed',
    transcriptChars: 2330,
    hasMinutes: true,
    sizeBytes: 30976000,
    error: '',
  },
  {
    id: '20261109-102100-e5f6',
    title: '录音测试（转写失败）',
    startedAt: '2026-11-09T02:21:00.000Z',
    durationSec: 96,
    mode: 'after',
    language: 'zh',
    status: 'failed',
    transcriptChars: 0,
    hasMinutes: false,
    sizeBytes: 3072000,
    error: '本地识别服务未就绪：模型尚未加载完成',
  },
];
const state = {
  ok: true,
  platform: { supported: true, name: 'macOS (arm64)', reason: '' },
  config: {
    storageDir: `${HOME}/dsh-meetings`,
    transcribeMode: 'after',
    language: 'zh',
    providerId: 'sensevoice-local',
    captureSystemAudio: true,
    captureMicrophone: true,
    chunkSeconds: 25,
    detectEnabled: true,
    detectNotify: true,
  },
  storage: { dir: `${HOME}/dsh-meetings`, exists: true, writable: true },
  provider: {
    id: 'sensevoice-local',
    name: 'SenseVoiceSmall (INT8)',
    location: 'host-local',
    languages: ['auto', 'zh', 'en', 'yue', 'ja', 'ko'],
    preparation: { phase: 'standby', steps: [] },
  },
  providerReady: true,
  speechAvailable: true,
  models: [
    {
      id: 'sensevoice-local',
      source: 'plugin',
      name: 'SenseVoiceSmall (INT8)',
      location: 'host-local',
      languages: ['auto', 'zh', 'en', 'yue', 'ja', 'ko'],
      downloadSources: ['https://huggingface.co', 'https://hf-mirror.com'],
      setupEstimate: { recommendedDiskBytes: 1e9, expectedMemoryBytes: 1e9, minimumMinutes: 1, maximumMinutes: 10 },
      preparation: { phase: 'ready', steps: [{ kind: 'check', status: 'complete' }] },
      selected: true,
      ready: true,
      preparing: false,
      canPrepare: false,
    },
    {
      id: 'whisper-local',
      source: 'dsh',
      name: 'Whisper Small (INT8)',
      location: 'host-local',
      languages: ['auto', 'zh', 'en'],
      downloadSources: ['https://huggingface.co', 'https://hf-mirror.com'],
      setupEstimate: { recommendedDiskBytes: 5e8, expectedMemoryBytes: 8e8, minimumMinutes: 2, maximumMinutes: 6 },
      preparation: { phase: 'unprepare', steps: [] },
      selected: false,
      ready: false,
      preparing: false,
      canPrepare: true,
    },
    {
      id: 'qwen3-asr-0.6b',
      source: 'plugin',
      name: 'Qwen3-ASR-0.6B (INT8)',
      location: 'host-local',
      languages: ['auto', 'zh', 'en', 'yue', 'ja', 'ko'],
      downloadSources: ['https://modelscope.cn', 'https://hf-mirror.com'],
      setupEstimate: { recommendedDiskBytes: 1.15e9, expectedMemoryBytes: 1.6e9, minimumMinutes: 3, maximumMinutes: 25 },
      preparation: { phase: 'unprepare', steps: [] },
      selected: false,
      ready: false,
      preparing: false,
      canPrepare: true,
      realtime: false,
    },
  ],
  recording: {
    active: false,
    meetingId: '',
    title: '',
    mode: 'after',
    startedAt: '',
    seconds: 0,
    partial: '',
    segments: [],
    micLevel: 0.18,
    systemLevel: 0.42,
  },
  meetings,
  detect: {
    enabled: true,
    available: true,
    running: true,
    inMeeting: true,
    app: 'tencent-meeting',
    appName: '腾讯会议',
    since: '2026-11-11T11:05:00.000Z',
    error: '',
    cooldownUntil: '',
    suggestion: {
      id: 'detect-preview-1',
      kind: 'start',
      app: 'tencent-meeting',
      appName: '腾讯会议',
      title: '腾讯会议 · 版本收敛方案讨论',
      createdAt: '2026-11-11T11:05:00.000Z',
      expiresAt: '2026-11-11T11:07:00.000Z',
    },
  },
  capabilities: { recorderBuilt: true, canRecord: true },
};

const transcript = `# 版本收敛方案讨论

时间：2026-11-10 13:46 · 时长 25:24 · 中文

## 转写

[00:00] 好，人都到齐了，我们开始今天的会议。

[00:12] 今天主要讨论三件事：第一是版本收口，第二是新项目交付节奏，第三是存量项目的更新策略。

[00:41] 先说版本收口。客户端现在 2.x 和 3.x 两条线并行维护，维护成本很高，我们希望把 2.x 系列也收口到 3.x 主线。

[01:20] 这里有个前提，就是服务端还有多个版本在用，所以主线版本必须持续兼容多个服务端版本。

[02:05] 新项目一律交付最新版；存量项目在出现 bug 或者新需求的时候，跟随最新版一起交付。

[02:44] 发布节奏上，客户端改为敏捷迭代发布，每月发布一次，商业项目需求都放进每月的主线版本里完成。

[03:30] 如果有个别项目有紧急需求，可以走 hotfix，但版本号还是收敛在 3.x 上。

[04:02] 那这个月的主线版本，目标就是 3.2.1，把 2.x 和 3.x 归一。

[04:40] 好，这一条就定下来，下面说新项目交付。`;

const minutes = `# 版本收敛方案讨论 · 会议纪要

| 项目 | 内容 |
| --- | --- |
| 会议时间 | 2026-11-10 13:46 |
| 参会人 | 叶凯胜、张继德、肖亚、邵长青 |
| 会议主题 | 客户端版本收敛与交付节奏 |

## 一、核心结论

1. **版本归一**：2.x 系列收口到 3.x 主线版本，由 3.x 主线持续维护并兼容多个服务端版本。
2. **一次编译多版本交付**：用一次编译支撑多个版本的交付，减少分支维护成本。
3. **月度发布**：客户端改为敏捷迭代，**每月发布一次**；商业项目需求统一纳入每月主线版本。

## 二、交付策略

- **新项目**：直接交付最新客户端版本。
- **存量项目**：仅在出现 bug 或新需求时更新，跟随最新版本交付。
- **紧急需求**：走 hotfix 通道，版本号仍收敛在 3.x。

## 三、待办事项

- [ ] 输出 2.x → 3.x 迁移清单与风险项（负责人：张继德，本周五前）
- [ ] 确认服务端版本兼容矩阵（负责人：肖亚）
- [ ] 3.2.1 版本分支冻结时间点（负责人：叶凯胜）

> 风险：存量项目中仍有使用 2.5 以下版本的环境，升级窗口需要与服务端版本对齐。

## 四、下一步

下周技术评审会前，把迁移清单和技术方案初稿发到群里评审。`;

globalThis.fetch = async (input) => {
  const url = String(input);
  const json = (value) =>
    new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
  if (url.includes('/recordings/events')) {
    return new Response(new ReadableStream({ start() {} }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  if (url.includes('/detect/events')) {
    return new Response(new ReadableStream({ start() {} }), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  }
  if (url.endsWith('/dsh-meeting-notes/state')) return json(state);
  if (url.includes('/dsh-meeting-notes/meetings/')) {
    return json({
      ok: true,
      meeting: meetings[0],
      transcript,
      minutes,
      audio: { exists: true, bytes: 48771000 },
    });
  }
  return json({ ok: true });
};

const source = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
let mod = null;
window.__ModuleLoader__ = {
  load(entry) {
    mod = entry.factory((name) => {
      if (name === 'react') return React;
      throw new Error(`unknown module ${name}`);
    });
  },
};
window.eval(source);

const dicts = {};
const registered = {};
const fakeCtx = {
  locale: {
    bind: (ns) => (key, params) => {
      const template = dicts[ns]?.[key] ?? key;
      if (!params || typeof template !== 'string') return template;
      return template.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
      );
    },
    register: (ns, lang, dict) => {
      if (lang !== 'zh') return () => {};
      dicts[ns] = { ...(dicts[ns] || {}), ...dict };
      return () => {};
    },
  },
  slots: {
    inject: (_name, factory) => factory(),
    register: (decl, component) => {
      registered[`${decl.name}#${decl.id || decl.key}`] = component;
      return () => {};
    },
  },
  effect: (fn) => {
    fn();
    return () => {};
  },
  layout: { selectPanel: () => {} },
  uiWorkspace: { openSession: () => {} },
};
mod.apply(fakeCtx);

Object.defineProperty(dom.window.navigator, 'clipboard', {
  configurable: true,
  value: { writeText: async () => {} },
});
const root = createRoot(window.document.getElementById('root'));
const MainPage = registered['main#dsh-meeting-notes'];

const THEMES = {
  light: {
    '--dsw-alias-bg-base': '#ffffff',
    '--dsw-alias-bg-layer-1': '#ffffff',
    '--dsw-alias-bg-layer-2': '#ffffff',
    '--dsw-alias-bg-layer-3': '#ffffff',
    '--dsw-alias-bg-overlay': '#e9ecf2',
    '--dsw-alias-bg-module-platform': '#f5f6f7',
    '--dsw-alias-bg-skeleton': '#0000000a',
    '--dsw-alias-bg-mask-1': '#0000003d',
    '--dsw-alias-border-l1': '#0000000a',
    '--dsw-alias-border-l2': '#0000001a',
    '--dsw-alias-border-l3': '#0000001f',
    '--dsw-alias-border-l4': '#00000029',
    '--dsw-alias-brand-primary': '#0f1115',
    '--dsw-alias-label-primary': '#0f1115',
    '--dsw-alias-label-secondary': '#61666b',
    '--dsw-alias-label-tertiary': '#81858c',
    '--dsw-alias-label-caption': '#adb2b8',
    '--dsw-alias-state-success-primary': '#22c55e',
    '--dsw-alias-state-warn-primary': '#f59e0b',
    '--dsw-alias-state-error-primary': '#dc2626',
    '--dsw-alias-state-idle-primary': '#cfd3d6',
    '--dsw-alias-interactive-bg-hover': '#2631480f',
    '--dsw-alias-interactive-bg-active': '#2631481a',
    '--dsw-alias-button-primary-fill': '#0f1115',
    '--dsw-alias-button-primary-hover': '#43454a',
    '--dsw-alias-label-primary-foreground': '#ffffff',
    '--dsw-alias-tooltip-bg': '#2c2c2e',
    '--dsw-alias-toast-bg': '#353638',
    '--dsw-alias-toast-label': '#ffffff',
    '--dsw-alias-switch-thumb': '#ffffff',
    '--dsw-mask-blur': 'none',
  },
  dark: {
    '--dsw-alias-bg-base': '#151517',
    '--dsw-alias-bg-layer-1': '#232324',
    '--dsw-alias-bg-layer-2': '#2c2c2e',
    '--dsw-alias-bg-layer-3': '#353638',
    '--dsw-alias-bg-overlay': '#61666b',
    '--dsw-alias-bg-module-platform': '#353638',
    '--dsw-alias-bg-skeleton': '#ffffff14',
    '--dsw-alias-bg-mask-1': '#00000080',
    '--dsw-alias-border-l1': '#ffffff0f',
    '--dsw-alias-border-l2': '#ffffff1f',
    '--dsw-alias-border-l3': '#ffffff29',
    '--dsw-alias-border-l4': '#ffffff33',
    '--dsw-alias-brand-primary': '#f9fafb',
    '--dsw-alias-label-primary': '#f9fafb',
    '--dsw-alias-label-secondary': '#cfd3d6',
    '--dsw-alias-label-tertiary': '#adb2b8',
    '--dsw-alias-label-caption': '#81858c',
    '--dsw-alias-state-success-primary': '#22c55e',
    '--dsw-alias-state-warn-primary': '#f59e0b',
    '--dsw-alias-state-error-primary': '#f87171',
    '--dsw-alias-state-idle-primary': '#61666b',
    '--dsw-alias-interactive-bg-hover': '#ffffff14',
    '--dsw-alias-interactive-bg-active': '#ffffff24',
    '--dsw-alias-button-primary-fill': '#f9fafb',
    '--dsw-alias-button-primary-hover': '#ebeef2',
    '--dsw-alias-label-primary-foreground': '#0f1115',
    '--dsw-alias-tooltip-bg': '#43454a',
    '--dsw-alias-toast-bg': '#43454a',
    '--dsw-alias-toast-label': '#ffffff',
    '--dsw-alias-switch-thumb': '#adb2b8',
    '--dsw-mask-blur': 'none',
  },
};

const EXTRA_TOKENS = (dark) => ({
  '--dsw-radius-xs': '4px',
  '--dsw-radius-sm': '8px',
  '--dsw-radius-md': '12px',
  '--dsw-radius-lg': '16px',
  '--dsw-radius-xl': '20px',
  '--dsw-radius-panel': '28px',
  '--dsw-shadow-lv1': '0 2px 4px 0 #0000000d',
  '--dsw-shadow-lv3': '0 0 1px 0 #0003, 0 0 4px 0 #00000005, 0 12px 32px 0 #00000014',
  '--dsw-elevation-prominent': dark
    ? '0 0 1px 0 #ffffff1f, 0 3px 8px 0 #00000033, 0 0 20px 0 #00000040'
    : '0 0 1px 0 #0000001f, 0 3px 8px 0 #0000000a, 0 0 20px 0 #0000000d',
  '--ds-ease-in-out': 'cubic-bezier(.4,0,.2,1)',
  '--ds-transition-duration': '.2s',
  '--ds-transition-duration-fast': '.1s',
});

const tokens = (theme) =>
  Object.entries(theme)
    .map(([key, value]) => `${key}:${value};`)
    .join('');

const page = (body, theme, title) => `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${title}</title>
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif; }
  body { color-scheme: ${theme === THEMES.dark ? 'dark' : 'light'}; ${tokens({ ...theme, ...EXTRA_TOKENS(theme === THEMES.dark) })} background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary); }
  #stage { width: 1280px; min-height: 900px; }
  /* 截图走查不需要动画，避免抓在过渡中间帧。 */
  #stage * { animation: none !important; transition: none !important; }
</style></head>
<body><div id="stage">${body}</div></body></html>`;

const snapshot = (theme, name) => {
  const html = window.document.getElementById('root').innerHTML;
  writeFileSync(`${outDir}/${name}.html`, page(html, THEMES[theme], name));
};

await act(async () => {
  root.render(React.createElement(MainPage));
});
await act(async () => {
  await new Promise((r) => setTimeout(r, 120));
});
const container = window.document.getElementById('root');
const meetingBtn = [...container.querySelectorAll('button')].find((el) => (el.textContent || '').includes('版本收敛方案讨论'));
if (meetingBtn) {
  await act(async () => {
    meetingBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
}

// 主界面：文稿 / 纪要 / 设置弹窗，各出一份
for (const theme of ['light', 'dark']) {
  snapshot(theme, `main-transcript-${theme}`);
  const tab = [...container.querySelectorAll('[role="tab"]')].find((el) => (el.textContent || '').includes('纪要'));
  if (tab) {
    await act(async () => {
      tab.click();
      await new Promise((r) => setTimeout(r, 80));
    });
    snapshot(theme, `main-minutes-${theme}`);
    const back = [...container.querySelectorAll('[role="tab"]')].find((el) => (el.textContent || '').includes('文稿'));
    if (back) {
      await act(async () => {
        back.click();
        await new Promise((r) => setTimeout(r, 60));
      });
    }
  }
  const gear = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '设置');
  if (gear) {
    await act(async () => {
      gear.click();
      await new Promise((r) => setTimeout(r, 80));
    });
    snapshot(theme, `main-settings-${theme}`);
    const close = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '关闭');
    if (close) {
      await act(async () => {
        close.click();
        await new Promise((r) => setTimeout(r, 60));
      });
    }
  }
}

// 删除确认（ConfirmDialog）与复制成功（Toast）
for (const theme of ['light', 'dark']) {
  const del = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '删除');
  if (del) {
    await act(async () => {
      del.click();
      await new Promise((r) => setTimeout(r, 80));
    });
    snapshot(theme, `main-confirm-${theme}`);
    const cancel = [...container.querySelectorAll('button')].find((el) => (el.textContent || '').trim() === '取消');
    if (cancel) {
      await act(async () => {
        cancel.click();
        await new Promise((r) => setTimeout(r, 60));
      });
    }
  }
  const copy = [...container.querySelectorAll('button')].find((el) => (el.textContent || '').includes('复制文稿'));
  if (copy) {
    await act(async () => {
      copy.click();
      await new Promise((r) => setTimeout(r, 60));
    });
    snapshot(theme, `main-toast-${theme}`);
    // 等 notice 4s 自动清空，避免串进下一轮的截图里
    await act(async () => {
      await new Promise((r) => setTimeout(r, 4300));
    });
  }
}

// 录音中状态（电平 + 实时字幕）
state.recording = {
  active: true,
  meetingId: '20261110-224000-abcd',
  title: '版本收敛方案讨论',
  mode: 'realtime',
  startedAt: new Date().toISOString(),
  seconds: 74,
  partial: '那这个月的主线版本目标就是 3.2.1',
  segments: [
    { fromSec: 0, toSec: 18, text: '好，人都到齐了，我们开始今天的会议。' },
    { fromSec: 18, toSec: 44, text: '今天主要讨论三件事：版本收口、新项目交付节奏，还有存量项目的更新策略。' },
    { fromSec: 44, toSec: 68, text: '先说版本收口，客户端现在 2.x 和 3.x 两条线并行维护，维护成本很高。' },
  ],
  micLevel: 0.62,
  systemLevel: 0.48,
};
state.config.transcribeMode = 'realtime';
for (const theme of ['light', 'dark']) {
  const refresh = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '刷新');
  if (refresh) {
    await act(async () => {
      refresh.click();
      await new Promise((r) => setTimeout(r, 150));
    });
  }
  snapshot(theme, `main-recording-${theme}`);
  state.config.transcribeMode = 'after';
}

console.log(`preview written to ${outDir}`);
await act(async () => {
  root.unmount();
});
dom.window.close();
