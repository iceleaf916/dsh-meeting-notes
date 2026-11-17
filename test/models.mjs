// 模型下拉测试：设置页与顶栏都用下拉选择模型，验证状态文案、详情卡、切换、下载/取消准备与保存。
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
  source: 'plugin',
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
  source: 'dsh',
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

const xingchen = {
  id: 'xingchen-asr',
  source: 'plugin',
  name: 'XingChenASR-V3.2-Ultra (SiliconFlow)',
  location: 'cloud',
  languages: ['auto', 'zh', 'en', 'yue'],
  downloadSources: [],
  setupEstimate: null,
  maxChunkSeconds: 50,
  realtime: false,
  preparation: {
    phase: 'unprepare',
    message: '未配置硅基流动 API 密钥：请在模型下方的输入框中填写后使用云端识别。',
  },
  selected: false,
  ready: false,
  preparing: false,
  canPrepare: false,
};

const state = {
  ok: true,
  platform: { supported: true, name: 'macOS (arm64)', reason: '' },
  config: {
    storageDir: `${HOME}/dsh-meetings`,
    transcribeMode: 'after',
    language: 'zh',
    providerId: 'sensevoice-local',
    siliconflowApiKey: '',
    captureSystemAudio: true,
    captureMicrophone: true,
    chunkSeconds: 25,
  },
  storage: { dir: `${HOME}/dsh-meetings`, exists: true, writable: true },
  speechAvailable: true,
  models: [sensevoice, whisper, xingchen],
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
    if (body && body.providerId) selectProvider(body.providerId);
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
const detail = () => panel() && panel().querySelector('[data-model]');
const detailButton = (label) => {
  const node = detail();
  return node ? [...node.querySelectorAll('button')].find((el) => (el.textContent || '').includes(label)) : null;
};
const picker = () => panel() && panel().querySelector('#mn-model-select');
const configCalls = () => calls.filter((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/config'));
const pickModel = async (id) => {
  const select = picker();
  select.value = id;
  await act(async () => {
    select.dispatchEvent(new window.Event('change', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 80));
  });
};

ok(!!panel(), '设置弹窗打开');
ok((panel()?.textContent || '').includes('识别模型'), '设置页出现「识别模型」分组');
ok(!!picker(), '识别模型改为下拉选择');
ok(picker()?.value === 'sensevoice-local', '下拉默认停在当前使用的模型');
const options = [...(picker()?.options || [])];
ok(options.length === 3, '下拉列出全部 3 个模型');
ok((options[0]?.textContent || '').includes('已就绪'), '就绪模型选项标注「已就绪」');
ok((options[1]?.textContent || '').includes('未下载'), '本地未下载模型选项标注「未下载」');
ok((options[2]?.textContent || '').includes('未配置密钥'), '云端未配置模型选项标注「未配置密钥」');
ok(panel().querySelectorAll('[data-model]').length === 1, '同一时间只展示所选模型的详情卡');
ok((detail()?.textContent || '').includes('当前使用'), '默认详情卡是当前使用模型并标注「当前使用」');
ok((detail()?.textContent || '').includes('插件自带'), '自带引擎标注「插件自带」来源');

// 下拉只切换查看对象，详情卡跟随
await pickModel('whisper-local');
ok(detail()?.getAttribute('data-model') === 'whisper-local', '下拉切换后详情卡跟随所选模型');
ok((detail()?.textContent || '').includes('DSH 语音插件'), 'DSH provider 标注「DSH 语音插件」来源');
ok((detail()?.textContent || '').includes('未下载'), '未下载本地模型状态为「未下载」');
ok(!!detailButton('下载并准备'), '未下载模型显示「下载并准备」');
ok((detail()?.textContent || '').includes('硬盘占用约 0.5 GB'), '未下载模型显示磁盘估算');
ok(!!detailButton('使用该模型'), '未选中的模型有「使用该模型」按钮');

// 1) 下载准备：POST /prepare，进度条与取消按钮出现
const prepareBtn = detailButton('下载并准备');
ok(!!prepareBtn, '找到「下载并准备」按钮');
if (prepareBtn) {
  await act(async () => {
    prepareBtn.click();
    await new Promise((r) => setTimeout(r, 160));
  });
  const prepared = calls.find((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/prepare'));
  ok(!!prepared && prepared.body && prepared.body.providerId === 'whisper-local', '下载准备 POST /prepare 带 providerId');
  ok(prepared?.headers && (prepared.headers['x-dsh-meeting-notes'] === '1' || prepared.headers['X-Meeting-Notes'] === '1'), 'POST /prepare 带 x-dsh-meeting-notes 头');
  const downloadingText = detail()?.textContent || '';
  ok(/下载：25 \/ 100 MB/.test(downloadingText), '下载中显示字节进度');
  ok(downloadingText.includes('取消准备'), '下载中显示「取消准备」按钮');
  ok(!!detail()?.querySelector('[role="progressbar"]'), '下载中渲染进度条');

  // 2) 取消准备：POST /prepare/cancel
  const cancelBtn = detailButton('取消准备');
  if (cancelBtn) {
    await act(async () => {
      cancelBtn.click();
      await new Promise((r) => setTimeout(r, 120));
    });
    const cancelled = calls.find((call) => call.method === 'POST' && call.url.endsWith('/dsh-meeting-notes/prepare/cancel'));
    ok(!!cancelled && cancelled.body && cancelled.body.providerId === 'whisper-local', '取消准备 POST /prepare/cancel 带 providerId');
    ok((detail()?.textContent || '').includes('已取消'), '取消后状态显示已取消');
  } else {
    fail('下载中没有找到「取消准备」按钮');
  }
}

// 3) 使用该模型：POST /config 带 providerId，详情卡标为当前使用
const useBtn = detailButton('使用该模型');
ok(!!useBtn, '详情卡保留「使用该模型」按钮');
if (useBtn) {
  await act(async () => {
    useBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const switched = configCalls().at(-1);
  ok(!!switched && switched.body && switched.body.providerId === 'whisper-local', '切换模型 POST /config 带 providerId');
  ok((detail()?.textContent || '').includes('当前使用'), '切换后该模型标为「当前使用」');
}

// 4) 云端模型：仅浏览不触发切换；未配置密钥与「不建议实时转写」都写进详情
const configCountBeforePick = configCalls().length;
await pickModel('xingchen-asr');
ok(detail()?.getAttribute('data-model') === 'xingchen-asr', '下拉切到云端模型后详情卡跟随');
ok(configCalls().length === configCountBeforePick, '仅浏览云端模型不会修改配置');
ok((detail()?.textContent || '').includes('硅基流动云端'), '云端模型标注「硅基流动云端」');
ok(!detailButton('下载并准备'), '云端模型不显示「下载并准备」');
ok((detail()?.textContent || '').includes('未配置密钥'), '云端模型状态为「未配置密钥」');
ok((detail()?.textContent || '').includes('未配置硅基流动 API 密钥'), '云端模型提示未配置密钥');
ok((detail()?.textContent || '').includes('不建议开启实时转写'), '云端模型说明不建议实时转写');

const keyInput = panel().querySelector('[data-field="siliconflow-key"]');
ok(!!keyInput, '云端模型行内有硅基流动 API 密钥输入框');
ok(keyInput?.getAttribute('type') === 'password', '密钥输入框以密码形式展示');
ok((panel()?.textContent || '').includes('SILICONFLOW_API_KEY'), '密钥说明提到环境变量回退');

// 5) 保存配置：POST /config 里带上密钥字段（留空表示回退环境变量）
const saveBtn = [...(panel()?.querySelectorAll('button') || [])].find((el) =>
  (el.textContent || '').includes('保存配置'),
);
ok(!!saveBtn, '设置页有「保存配置」按钮');
if (saveBtn) {
  await act(async () => {
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const saveCall = configCalls().at(-1);
  ok(
    !!saveCall && Object.prototype.hasOwnProperty.call(saveCall.body, 'siliconflowApiKey'),
    '保存 POST /config 带 siliconflowApiKey 字段',
  );
  ok(!panel(), '保存后设置弹窗关闭');
}

// 6) 顶栏模型入口：下拉列表，选中即切换
const topbarModel = () =>
  [...container.querySelectorAll('select')].find((el) => el.getAttribute('aria-label') === '选择识别模型');
ok(!!topbarModel(), '顶栏模型入口是下拉列表');
ok([...(topbarModel()?.options || [])].length === 3, '顶栏下拉列出全部模型');
const beforeTopbarSwitch = configCalls().length;
await act(async () => {
  topbarModel().value = 'xingchen-asr';
  topbarModel().dispatchEvent(new window.Event('change', { bubbles: true }));
  await new Promise((r) => setTimeout(r, 160));
});
const topbarSwitched = configCalls().at(-1);
ok(
  configCalls().length > beforeTopbarSwitch && topbarSwitched?.body?.providerId === 'xingchen-asr',
  '顶栏下拉切换模型直接 POST /config 带 providerId',
);
ok(topbarModel()?.value === 'xingchen-asr', '顶栏下拉反映切换结果');

console.log(process.exitCode ? 'MODELS FAILED' : 'MODELS OK');
await act(async () => {
  root.unmount();
});
dom.window.close();
process.exit(process.exitCode || 0);
