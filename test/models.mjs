// 模型列表交互测试：验证设置页里多模型列表、切换模型、下载/取消准备三条链路。
// 用法：在仓库根目录执行 `node test/models.mjs`（依赖根目录 node_modules 里的 react/react-dom/jsdom）。
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const HOME = process.env.HOME || '/Users/you';

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

const sensevoice = {
  id: 'sensevoice-local',
  name: 'SenseVoiceSmall (INT8)',
  location: 'host-local',
  languages: ['auto', 'zh', 'en'],
  downloadSources: ['https://huggingface.co', 'https://hf-mirror.com'],
  setupEstimate: {
    recommendedDiskBytes: 1e9,
    expectedMemoryBytes: 1e9,
    minimumMinutes: 1,
    maximumMinutes: 10,
  },
  preparation: { phase: 'ready', steps: [{ kind: 'check', status: 'complete' }] },
  selected: true,
  ready: true,
  preparing: false,
  canPrepare: false,
};

const whisper = {
  id: 'whisper-local',
  name: 'Whisper Small (INT8)',
  location: 'host-local',
  languages: ['auto', 'zh', 'en'],
  downloadSources: ['https://huggingface.co', 'https://hf-mirror.com'],
  setupEstimate: {
    recommendedDiskBytes: 5e8,
    expectedMemoryBytes: 8e8,
    minimumMinutes: 2,
    maximumMinutes: 6,
  },
  preparation: { phase: 'unprepare', steps: [] },
  selected: false,
  ready: false,
  preparing: false,
  canPrepare: true,
};

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
  },
  storage: { dir: `${HOME}/dsh-meetings`, exists: true, writable: true },
  speechAvailable: true,
  models: [sensevoice, whisper],
  provider: {
    id: sensevoice.id,
    name: sensevoice.name,
    location: sensevoice.location,
    languages: sensevoice.languages,
    preparation: sensevoice.preparation,
  },
  providerReady: true,
  recording: {
    active: false,
    meetingId: '',
    title: '',
    mode: 'after',
    startedAt: '',
    seconds: 0,
    partial: '',
    segments: [],
    micLevel: 0,
    systemLevel: 0,
  },
  meetings: [],
  capabilities: { recorderBuilt: true, canRecord: true },
};

const selectProvider = (providerId) => {
  state.config = { ...state.config, providerId };
  state.models = state.models.map((model) => ({ ...model, selected: model.id === providerId }));
  state.provider = state.models.find((model) => model.id === providerId) || state.provider;
};

const calls = [];
const jsonResponse = (value, status = 200) =>
  new Response(JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/json' },
  });

globalThis.fetch = async (input, init = {}) => {
  const url = String(input);
  const method = (init.method || 'GET').toUpperCase();
  const body = init.body ? JSON.parse(init.body) : null;
  calls.push({ method, url, body, headers: init.headers || {} });
  if (url.includes('/recordings/events')) {
    return new Response(new ReadableStream({ start() {} }), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  }
  if (url.endsWith('/dsh-meeting-notes/state')) return jsonResponse(state);
  if (url.endsWith('/dsh-meeting-notes/config')) {
    selectProvider(body.providerId);
    return jsonResponse({ ok: true, config: state.config, storage: state.storage });
  }
  if (url.endsWith('/dsh-meeting-notes/prepare')) {
    const target = state.models.find((model) => model.id === body.providerId);
    if (target) {
      target.preparation = {
        phase: 'downloading',
        step: 'model',
        steps: [
          { kind: 'check', status: 'complete' },
          { kind: 'model', status: 'running' },
        ],
        resource: 'model.onnx',
        completedBytes: 25 * 1024 * 1024,
        totalBytes: 100 * 1024 * 1024,
      };
      target.preparing = true;
      target.canPrepare = false;
      target.ready = false;
    }
    return jsonResponse({ ok: true, providerId: body.providerId });
  }
  if (url.endsWith('/dsh-meeting-notes/prepare/cancel')) {
    const target = state.models.find((model) => model.id === body.providerId);
    if (target) {
      target.preparation = {
        phase: 'cancelled',
        steps: [{ kind: 'check', status: 'complete' }],
      };
      target.preparing = false;
      target.canPrepare = true;
      target.ready = false;
    }
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ ok: true });
};

// 加载 client.js（浏览器模块形态）
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
  uiWorkspace: { openSession: (id) => calls.push({ method: 'NAV', url: String(id) }) },
};

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};
const ok = (cond, msg) => (cond ? console.log('ok  -', msg) : fail(msg));

mod.apply(fakeCtx);

const container = window.document.getElementById('root');
const root = createRoot(container);
const MainPage = registered['main#dsh-meeting-notes'];
ok(!!MainPage, '注册了 main 面板');

await act(async () => {
  root.render(React.createElement(MainPage));
});
await act(async () => {
  await new Promise((r) => setTimeout(r, 80));
});

const settingsBtn = [...container.querySelectorAll('button')].find(
  (el) => (el.getAttribute('aria-label') || '') === '设置' || el.getAttribute('title') === '设置',
);
ok(!!settingsBtn, '找到设置按钮');
if (!settingsBtn) {
  process.exit(1);
}
await act(async () => {
  settingsBtn.click();
  await new Promise((r) => setTimeout(r, 80));
});

const panel = () => container.querySelector('[role="dialog"]');
const row = (id) => panel() && panel().querySelector(`[data-model="${id}"]`);
const rowButton = (id, label) => {
  const node = row(id);
  return node ? [...node.querySelectorAll('button')].find((el) => (el.textContent || '').includes(label)) : null;
};

ok(!!panel(), '设置弹窗打开');
ok((panel()?.textContent || '').includes('识别模型'), '设置页出现「识别模型」分组');
ok(!!row('sensevoice-local') && !!row('whisper-local'), '模型列表渲染两个模型（列表形式可扩展）');
ok((row('sensevoice-local')?.textContent || '').includes('当前使用'), '当前模型标注「当前使用」');
ok((row('whisper-local')?.textContent || '').includes('下载并准备'), '未准备的模型显示「下载并准备」');
ok((row('whisper-local')?.textContent || '').includes('硬盘占用约 0.5 GB'), '未准备模型显示磁盘估算');

// 1) 切换模型：POST /config 带 providerId
const useBtn = rowButton('whisper-local', '使用该模型');
ok(!!useBtn, '未选中的模型有「使用该模型」按钮');
if (useBtn) {
  await act(async () => {
    useBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const saved = calls.find((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/config'));
  ok(!!saved && saved.body && saved.body.providerId === 'whisper-local', '切换模型 POST /config 带 providerId');
  ok(!!row('whisper-local') && (row('whisper-local').textContent || '').includes('当前使用'), '切换后该模型标为「当前使用」');
}

// 2) 下载准备：POST /prepare，进度条与取消按钮出现
const prepareBtn = rowButton('whisper-local', '下载并准备');
ok(!!prepareBtn, '重新查询到「下载并准备」按钮');
if (prepareBtn) {
  await act(async () => {
    prepareBtn.click();
    await new Promise((r) => setTimeout(r, 160));
  });
  const prepared = calls.find((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/prepare'));
  ok(!!prepared && prepared.body && prepared.body.providerId === 'whisper-local', '下载准备 POST /prepare 带 providerId');
  ok(prepared?.headers && (prepared.headers['x-dsh-meeting-notes'] === '1' || prepared.headers['X-Meeting-Notes'] === '1'), 'POST /prepare 带 x-dsh-meeting-notes 头');
  const downloadingText = row('whisper-local')?.textContent || '';
  ok(/下载：25 \/ 100 MB/.test(downloadingText), '下载中显示字节进度');
  ok(downloadingText.includes('取消准备'), '下载中显示「取消准备」按钮');
  ok(!!row('whisper-local')?.querySelector('[role="progressbar"]'), '下载中渲染进度条');

  // 3) 取消准备：POST /prepare/cancel
  const cancelBtn = rowButton('whisper-local', '取消准备');
  if (cancelBtn) {
    await act(async () => {
      cancelBtn.click();
      await new Promise((r) => setTimeout(r, 120));
    });
    const cancelled = calls.find((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/prepare/cancel'));
    ok(!!cancelled && cancelled.body && cancelled.body.providerId === 'whisper-local', '取消准备 POST /prepare/cancel 带 providerId');
    ok((row('whisper-local')?.textContent || '').includes('已取消'), '取消后状态显示已取消');
  } else {
    fail('下载中没有找到「取消准备」按钮');
  }
}

console.log(process.exitCode ? 'MODELS FAILED' : 'MODELS OK');
await act(async () => {
  root.unmount();
});
dom.window.close();
process.exit(process.exitCode || 0);
