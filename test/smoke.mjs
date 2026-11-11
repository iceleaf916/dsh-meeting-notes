// 客户端 UI 冒烟测试（不是插件运行时的一部分，只给开发用）。
// 用法：在本目录 `npm i react@19 react-dom@19 jsdom` 后执行 `node test/smoke.mjs`。
// 它用真实 React + jsdom 渲染 client.js，stub 掉 fetch，断言首屏、录音与纪要跳转三条主链路。
// 真实 React + jsdom 冒烟：把 dsh-meeting-notes/client.js 挂起来渲染，验证 UI 不炸。
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
  provider: {
    id: 'sensevoice-local',
    name: 'SenseVoiceSmall (INT8)',
    location: 'host-local',
    languages: ['auto', 'zh', 'en'],
    preparation: { phase: 'ready', steps: [{ kind: 'check', status: 'complete' }] },
  },
  providerReady: true,
  speechAvailable: true,
  models: [
    {
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
    micLevel: 0,
    systemLevel: 0,
  },
  meetings: [
    {
      id: '20261110-134626-6586',
      title: 'TTS测试',
      startedAt: '2026-11-10T05:46:26.784Z',
      durationSec: 9,
      mode: 'after',
      language: 'zh',
      status: 'transcribed',
      transcriptChars: 120,
      hasMinutes: true,
      sizeBytes: 295724,
      error: '',
    },
  ],
  capabilities: { recorderBuilt: true, canRecord: true },
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
  calls.push({ method, url, headers: init.headers || {} });
  if (url.includes('/recordings/events')) {
    return new Response(new ReadableStream({ start() {} }), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    });
  }
  if (url.endsWith('/dsh-meeting-notes/state')) return jsonResponse(state);
  if (url.includes('/meetings/') && url.endsWith('/minutes')) {
    return jsonResponse({ ok: true, sessionId: 'session-test-1', workspaceId: 'ws-1', title: '纪要 · TTS测试' });
  }
  if (url.includes('/dsh-meeting-notes/meetings/')) {
    return jsonResponse({
      ok: true,
      meeting: state.meetings[0],
      transcript: '# TTS测试\n\n## 转写\n\n[00:00] 大家好，现在我们开始今天的项目周会。',
      minutes: '# 纪要\n\n- 议题：版本收敛',
      audio: { exists: true, bytes: 295724 },
    });
  }
  if (url.endsWith('/recordings')) return jsonResponse({ ok: true, meetingId: 'x' });
  if (url.endsWith('/recordings/stop')) return jsonResponse({ ok: true, status: 'transcribing' });
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
    // 实现与真实 locale 相同：支持 {name} 占位符插值。
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
    const cleanup = fn();
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
ok(!!registered['sidebar.panellist#dsh-meeting-notes'], '注册了 sidebar.panellist 入口');
ok(!!registered['main#dsh-meeting-notes'], '注册了 main 面板');

const container = window.document.getElementById('root');
const root = createRoot(container);

const PanelIcon = registered['sidebar.panellist#dsh-meeting-notes'];
const MainPage = registered['main#dsh-meeting-notes'];

await act(async () => {
  root.render(React.createElement('div', null, React.createElement(PanelIcon, { size: 20, active: true }), React.createElement(MainPage)));
});

// 等待 5s 轮询逻辑里的首次 async 加载
await act(async () => {
  await new Promise((r) => setTimeout(r, 60));
  await new Promise((r) => setTimeout(r, 60));
});

const text = container.textContent || '';

const html = container.innerHTML || '';

ok(text.includes('会议记录'), '渲染出「会议记录」标题');
ok(text.includes('开始录音'), '渲染出「开始录音」按钮');
ok(text.includes('TTS测试'), '渲染出会议列表项 TTS测试');
ok(text.includes('SenseVoiceSmall'), '渲染出识别模型名');
ok(text.includes('结束'), '渲染出转写模式');
ok(!text.includes('读取会议记录状态失败'), '没有状态加载失败提示');
ok(!/requestFailed|未知错误/.test(text), '没有未知错误提示');
ok(html.includes('mn-root'), '根样式类 mn-root 存在');
ok(calls.some((c) => c.url.endsWith('/dsh-meeting-notes/state')), '拉取了 /state');

// 点击「开始录音」，验证 POST 与 SSE 连接
const btn = [...container.querySelectorAll('button')].find((el) => (el.textContent || '').includes('开始录音'));
ok(!!btn, '找到开始录音按钮');
if (btn) {
  await act(async () => {
    btn.click();
    await new Promise((r) => setTimeout(r, 80));
  });
  const post = calls.find((c) => c.method === 'POST' && c.url.endsWith('/dsh-meeting-notes/recordings'));
  ok(!!post, '点击后 POST /recordings');
  ok(!!post && post.headers && (post.headers['x-dsh-meeting-notes'] === '1' || post.headers['X-Meeting-Notes'] === '1'), 'POST 带 x-dsh-meeting-notes 头');
}


// 选中会议 -> 详情加载 -> 点击「生成会议纪要」-> 应调用 uiWorkspace.openSession
const meetingBtn = [...container.querySelectorAll('button, [role="button"]')].find((el) =>
  (el.textContent || '').includes('TTS测试'),
);
ok(!!meetingBtn, '会议列表里找到可点击项');
if (meetingBtn) {
  await act(async () => {
    meetingBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const minutesBtn = [...container.querySelectorAll('button')].find((el) =>
    /生成会议纪要|重新生成纪要/.test(el.textContent || ''),
  );
  ok(!!minutesBtn, '详情区出现「生成会议纪要」按钮');
  if (minutesBtn) {
    await act(async () => {
      minutesBtn.click();
      await new Promise((r) => setTimeout(r, 120));
    });
    const nav = calls.find((c) => c.method === 'NAV');
    ok(!!nav && nav.url === 'session-test-1', '点击纪要后跳转会话（openSession 被调用）');
  }
}

// 设置弹窗：打开 -> 改字段 -> 有未保存提示 -> 保存 POST /config 并关闭
const settingsBtn = [...container.querySelectorAll('button')].find(
  (el) => (el.getAttribute('aria-label') || '') === '设置' || el.getAttribute('title') === '设置',
);
ok(!!settingsBtn, '找到设置按钮');
if (settingsBtn) {
  await act(async () => {
    settingsBtn.click();
    await new Promise((r) => setTimeout(r, 80));
  });
  const dialog = container.querySelector('[role="dialog"]');
  ok(!!dialog, '点击设置后出现 role=dialog 弹窗');
  ok(!!dialog && (dialog.textContent || '').includes('识别模型'), '设置页出现「识别模型」分组');
  ok(!!dialog && (dialog.textContent || '').includes('SenseVoiceSmall'), '设置页模型列表显示 SenseVoiceSmall');
  ok(!!dialog && (dialog.textContent || '').includes('当前使用'), '设置页模型列表标出当前使用的模型');
  const dirInput = dialog && dialog.querySelector('input[type="text"]');
  ok(!!dirInput, '弹窗内出现存储目录输入框');
  const switchInput = dialog && dialog.querySelector('input[type="checkbox"]');
  ok(!!switchInput, '弹窗内出现采集开关');
  if (switchInput) {
    // jsdom 的 document 没有 oninput，React 会退化到 propertychange 路径，文本输入无法冒泡；
    // 这里用 checkbox 的 click 触发变更（真实浏览器两条路径都可用）。
    await act(async () => {
      switchInput.click();
      await new Promise((r) => setTimeout(r, 60));
    });
    ok((dialog.textContent || '').includes('有未保存的修改'), '编辑后显示未保存提示');
    const saveBtn = [...dialog.querySelectorAll('button')].find((el) => (el.textContent || '').includes('保存配置'));
    ok(!!saveBtn, '弹窗内有保存配置按钮');
    if (saveBtn) {
      await act(async () => {
        saveBtn.click();
        await new Promise((r) => setTimeout(r, 120));
      });
      const saved = calls.find((c) => c.method === 'POST' && c.url.endsWith('/dsh-meeting-notes/config'));
      ok(!!saved, '保存设置 POST /config');
      ok(!container.querySelector('[role="dialog"]'), '保存后弹窗关闭');
    }
  }
}

// 文稿 / 纪要 标签切换
const minutesTab = [...container.querySelectorAll('[role="tab"]')].find((el) => (el.textContent || '').includes('纪要'));
ok(!!minutesTab, '详情区出现「纪要」标签');
if (minutesTab) {
  await act(async () => {
    minutesTab.click();
    await new Promise((r) => setTimeout(r, 60));
  });
  ok((container.textContent || '').includes('议题：版本收敛'), '切换到纪要标签后渲染纪要内容');
}

console.log(process.exitCode ? 'SMOKE FAILED' : 'SMOKE OK');
// DSK 原语：Tooltip（hover 500ms）→ ConfirmDialog（勾选后才能删）→ Toast（复制成功）
const gear2 = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '设置');
if (gear2) {
  await act(async () => {
    gear2.dispatchEvent(new window.MouseEvent('pointerover', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 600));
  });
  const tip = container.querySelector('[role="tooltip"]');
  ok(!!tip && (tip.textContent || '').includes('设置'), 'hover 500ms 后出现 DSH tooltip');
  await act(async () => {
    gear2.dispatchEvent(new window.MouseEvent('pointerout', { bubbles: true }));
    await new Promise((r) => setTimeout(r, 30));
  });
  ok(!container.querySelector('[role="tooltip"]'), '移出后 tooltip 消失');
}

const delBtn = [...container.querySelectorAll('button')].find((el) => (el.getAttribute('aria-label') || '') === '删除');
ok(!!delBtn, '找到删除按钮');
if (delBtn) {
  await act(async () => {
    delBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const confirmDialog = container.querySelector('[role="dialog"]');
  ok(!!confirmDialog, '删除走 modal 确认框（role=dialog）');
  ok(!confirmDialog.querySelector('input[type="checkbox"]'), '确认框是普通二选一，没有额外勾选门槛');
  const confirmBtn = [...confirmDialog.querySelectorAll('button')].find((el) => (el.textContent || '').includes('删除会议'));
  ok(!!confirmBtn && !confirmBtn.disabled, '确认按钮默认可点');
  const cancelBtn = [...confirmDialog.querySelectorAll('button')].find((el) => (el.textContent || '').trim() === '取消');
  await act(async () => {
    if (cancelBtn) cancelBtn.click();
    await new Promise((r) => setTimeout(r, 80));
  });
  ok(!container.querySelector('[role="dialog"]'), '取消后确认框关闭');
  ok(!calls.some((c) => c.method === 'DELETE'), '取消后没有发出 DELETE');
}

// 真正点确认 -> DELETE /meetings/:id
if (delBtn) {
  await act(async () => {
    delBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const dialog2 = container.querySelector('[role="dialog"]');
  const goBtn = dialog2 && [...dialog2.querySelectorAll('button')].find((el) => (el.textContent || '').includes('删除会议'));
  await act(async () => {
    if (goBtn) goBtn.click();
    await new Promise((r) => setTimeout(r, 160));
  });
  const del = calls.find((c) => c.method === 'DELETE' && c.url.includes('/dsh-meeting-notes/meetings/'));
  ok(!!del, '确认删除后发出 DELETE /meetings/:id');
  ok(!container.querySelector('[role="dialog"]'), '删除后确认框关闭');
}

Object.defineProperty(window.navigator, 'clipboard', {
  value: { writeText: async () => {} },
  configurable: true,
});
const copyBtn = [...container.querySelectorAll('button')].find((el) => (el.textContent || '').includes('复制文稿'));
if (copyBtn) {
  await act(async () => {
    copyBtn.click();
    await new Promise((r) => setTimeout(r, 120));
  });
  const toast = container.querySelector('[role="status"]');
  ok(!!toast && (toast.textContent || '').includes('已复制'), '复制后出现 DSH toast 提示');
}

await act(async () => {
  root.unmount();
});
dom.window.close();
process.exit(process.exitCode || 0);
