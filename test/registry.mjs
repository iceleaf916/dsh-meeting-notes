// ASR 门面的纯逻辑测试：不加载模型、不联网，用假的 provider / DSH 服务验证路由与合并。
import { strict as assert } from 'node:assert';

import { createAsrRegistry } from '../asr-registry.js';
import { pickProvider, providerCatalog, providerView } from '../asr.js';

let passed = 0;

function ok(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

async function okAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`FAIL - ${name}`);
    throw error;
  }
}

function makeProvider(id, { phase = 'ready', languages = ['auto', 'zh', 'en'] } = {}) {
  const preparation = {
    state: { phase, steps: [] },
    snapshot() {
      return this.state;
    },
    prepare(options) {
      this.preparedWith = options;
      this.state = { phase: 'loading', steps: [] };
    },
    cancel() {
      this.cancelled = true;
    },
  };
  return {
    info: { id, name: `Self ${id}`, location: 'host-local', languages, maxChunkSeconds: 30, realtime: false },
    preparation,
    transcribeCalls: [],
    disposed: false,
    transcribe(input, signal) {
      this.transcribeCalls.push({ input, signal });
      return Promise.resolve({ text: `own:${id}` });
    },
    dispose() {
      this.disposed = true;
    },
  };
}

function makeDsh({ providers = [], onResolve, onPrepare, onTranscribe } = {}) {
  return {
    registered: [],
    prepareCalls: [],
    cancelCalls: [],
    register(provider) {
      this.registered.push(provider);
      return async () => {};
    },
    listProviders() {
      return providers.map((item) => item.info);
    },
    snapshot() {
      return {
        providers: providers.map((item) => ({
          ...item.info,
          preparation: item.preparation.snapshot(),
        })),
      };
    },
    resolve(spec) {
      if (onResolve) return onResolve(spec);
      return { provider: providers[0], audio: spec.audio, language: spec.language };
    },
    transcribe(spec, signal) {
      onTranscribe?.(spec, signal);
      return Promise.resolve({ text: 'dsh' });
    },
    prepare(id, options) {
      this.prepareCalls.push({ id, options });
      onPrepare?.(id, options);
    },
    cancelPreparation(id) {
      this.cancelCalls.push(id);
    },
  };
}

const sensevoice = makeProvider('sensevoice-local');
const qwen3 = makeProvider('qwen3-asr-0.6b');
const dshExtra = makeProvider('whisper-api', { phase: 'ready' });
const dshService = makeDsh({ providers: [dshExtra] });

const registry = createAsrRegistry({
  providers: [sensevoice, qwen3],
  failures: [
    {
      id: 'broken-engine',
      info: { id: 'broken-engine', name: 'Broken', location: 'host-local', languages: ['zh'] },
      message: 'Broken 初始化失败：原生模块缺失',
    },
  ],
  dsh: () => dshService,
});

ok('listProviders：自带 provider 在前，失败占位与 DSH 追加，按 id 去重', () => {
  const ids = registry.listProviders().map((item) => item.id);
  assert.deepEqual(ids, ['sensevoice-local', 'qwen3-asr-0.6b', 'broken-engine', 'whisper-api']);
});

ok('snapshot：标注 source，失败占位进入 failed phase', () => {
  const rows = registry.snapshot().providers;
  assert.deepEqual(
    rows.map((item) => [item.id, item.source, item.preparation.phase]),
    [
      ['sensevoice-local', 'plugin', 'ready'],
      ['qwen3-asr-0.6b', 'plugin', 'ready'],
      ['broken-engine', 'plugin', 'failed'],
      ['whisper-api', 'dsh', 'ready'],
    ],
  );
});

ok('DSH 未启用时模型列表仍然非空（不依赖语音插件）', () => {
  const alone = createAsrRegistry({ providers: [sensevoice, qwen3], failures: [], dsh: () => undefined });
  const models = providerCatalog(alone, 'qwen3-asr-0.6b');
  assert.equal(models.length, 2);
  assert.equal(models.find((model) => model.selected).id, 'qwen3-asr-0.6b');
  assert.equal(alone.dshAvailable(), false);
});

ok('pickProvider：配置 id 优先，缺失时回退到 sensevoice', () => {
  assert.equal(pickProvider(registry, 'qwen3-asr-0.6b').id, 'qwen3-asr-0.6b');
  assert.equal(pickProvider(registry, 'not-exists').id, 'sensevoice-local');
});

ok('resolve：命中自带 provider 时直接返回，非法语言报错', () => {
  const spec = registry.resolve({ providerId: 'sensevoice-local', language: 'zh', audio: new Uint8Array(4) });
  assert.equal(spec.provider, sensevoice);
  assert.throws(
    () => registry.resolve({ providerId: 'sensevoice-local', language: 'fr', audio: new Uint8Array(4) }),
    /Speech language is unsupported/,
  );
});

ok('resolve：自带 provider 缺失时交给 DSH；DSH 也没有则抛错', () => {
  const spec = registry.resolve({ providerId: 'whisper-api', language: 'zh', audio: new Uint8Array(2) });
  assert.equal(spec.audio.length, 2);
  const alone = createAsrRegistry({ providers: [], failures: [], dsh: () => undefined });
  assert.throws(
    () => alone.resolve({ providerId: 'whisper-api', language: 'zh', audio: new Uint8Array(0) }),
    /Speech provider is unavailable: whisper-api/,
  );
});

ok('resolve：失败占位报出初始化失败原因', () => {
  assert.throws(
    () => registry.resolve({ providerId: 'broken-engine', language: 'zh', audio: new Uint8Array(0) }),
    /Broken 初始化失败/,
  );
});

await okAsync('transcribe：自有 spec 走自带 provider，其它 spec 走 DSH', async () => {
  const ownSpec = registry.resolve({ providerId: 'qwen3-asr-0.6b', language: 'zh', audio: new Uint8Array(2) });
  const ownResult = await registry.transcribe(ownSpec, 'own-signal');
  assert.equal(ownResult.text, 'own:qwen3-asr-0.6b');
  assert.equal(ownSpec.provider.transcribeCalls.length, 1);

  const dshSpec = { provider: dshExtra, audio: new Uint8Array(2), language: 'zh' };
  const dshResult = await registry.transcribe(dshSpec, 'dsh-signal');
  assert.equal(dshResult.text, 'dsh');
});

ok('prepare：自带 provider 走自己的 preparation，DSH provider 走 service.prepare', () => {
  registry.prepare('sensevoice-local', { downloadSource: 'https://hf-mirror.com' });
  assert.deepEqual(sensevoice.preparation.preparedWith, { downloadSource: 'https://hf-mirror.com' });
  registry.prepare('whisper-api');
  assert.deepEqual(dshService.prepareCalls, [{ id: 'whisper-api', options: undefined }]);
  assert.throws(() => registry.prepare('missing-model'), /Speech provider is unavailable: missing-model/);
});

await okAsync('cancelPreparation：按归属路由；失败占位是 noop', async () => {
  await registry.cancelPreparation('sensevoice-local');
  assert.equal(sensevoice.preparation.cancelled, true);
  await registry.cancelPreparation('broken-engine');
  await registry.cancelPreparation('whisper-api');
  assert.deepEqual(dshService.cancelCalls, ['whisper-api']);
});

await okAsync('dispose：只 dispose 自带 provider', async () => {
  const a = makeProvider('a');
  const b = makeProvider('b');
  const alone = createAsrRegistry({ providers: [a, b], failures: [], dsh: () => undefined });
  await alone.dispose();
  assert.equal(a.disposed, true);
  assert.equal(b.disposed, true);
});

ok('DSH 服务抛异常时不影响自带模型列表', () => {
  const local = makeProvider('sensevoice-local');
  const broken = createAsrRegistry({
    providers: [local],
    failures: [],
    dsh: () => {
      throw new Error('service not ready');
    },
  });
  assert.deepEqual(broken.listProviders().map((item) => item.id), ['sensevoice-local']);
  assert.equal(providerView(broken, 'sensevoice-local').preparation.phase, 'ready');
});

console.log(`\nREGISTRY OK (${passed} checks)`);
