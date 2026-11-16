// 硅基流动云端 provider 的纯逻辑测试：不联网，fetch 全部走注入的假实现。
import { strict as assert } from 'node:assert';
import {
  XINGCHEN_MODEL,
  XINGCHEN_NO_KEY_MESSAGE,
  XINGCHEN_PROVIDER_INFO,
  createXingchenProvider,
  normalizeXingchenBaseUrl,
  requestXingchenTranscription,
  resolveXingchenApiKey,
} from '../xingchen.js';

let passed = 0;
function ok(name, fn) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}
async function okAsync(name, fn) {
  await fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

function makeWav(samples = 1600, sampleRate = 16_000) {
  const data = Buffer.alloc(samples * 2);
  for (let i = 0; i < samples; i += 1) {
    data.writeInt16LE(Math.round(Math.sin(i / 12) * 6000), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return new Uint8Array(Buffer.concat([header, data]));
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const savedKey = process.env.SILICONFLOW_API_KEY;
const savedBase = process.env.SILICONFLOW_BASE_URL;
delete process.env.SILICONFLOW_API_KEY;
delete process.env.SILICONFLOW_BASE_URL;

try {
  ok('provider info 声明云端、不支持实时、单块上限 50 秒', () => {
    assert.equal(XINGCHEN_PROVIDER_INFO.location ?? 'cloud', 'cloud');
    assert.equal(XINGCHEN_PROVIDER_INFO.realtime, false);
    assert.equal(XINGCHEN_PROVIDER_INFO.maxChunkSeconds, 50);
    assert.deepEqual(XINGCHEN_PROVIDER_INFO.languages, ['auto', 'zh', 'en', 'yue']);
    assert.deepEqual(XINGCHEN_PROVIDER_INFO.downloadSources, []);
  });

  ok('createXingchenProvider 返回 location=cloud 的 provider', () => {
    const provider = createXingchenProvider({ getApiKey: () => '' });
    assert.equal(provider.info.location, 'cloud');
    assert.equal(provider.info.id, XINGCHEN_PROVIDER_INFO.id);
    assert.equal(typeof provider.transcribe, 'function');
  });

  ok('没有密钥时准备状态是 unprepare 并带说明', () => {
    const provider = createXingchenProvider({ getApiKey: () => '' });
    const snapshot = provider.preparation.snapshot();
    assert.equal(snapshot.phase, 'unprepare');
    assert.equal(snapshot.message, XINGCHEN_NO_KEY_MESSAGE);
    assert.throws(() => provider.preparation.prepare(), /API 密钥/);
  });

  ok('配置了密钥后准备状态是 ready', () => {
    const provider = createXingchenProvider({ getApiKey: () => '  sk-test  ' });
    assert.deepEqual(provider.preparation.snapshot(), { phase: 'ready' });
    assert.deepEqual(provider.preparation.prepare(), { phase: 'ready' });
  });

  ok('配置为空时回退到 SILICONFLOW_API_KEY 环境变量', () => {
    process.env.SILICONFLOW_API_KEY = 'sk-env';
    try {
      assert.equal(resolveXingchenApiKey('   '), 'sk-env');
      assert.equal(resolveXingchenApiKey('sk-config'), 'sk-config');
      const provider = createXingchenProvider({ getApiKey: () => '' });
      assert.deepEqual(provider.preparation.snapshot(), { phase: 'ready' });
    } finally {
      delete process.env.SILICONFLOW_API_KEY;
    }
  });

  ok('base URL 规范化', () => {
    assert.equal(normalizeXingchenBaseUrl(''), 'https://api.siliconflow.cn/v1');
    assert.equal(normalizeXingchenBaseUrl('https://example.com/v1///'), 'https://example.com/v1');
  });

  await okAsync('transcribe 以 multipart 上传并解析 text / duration', async () => {
    const calls = [];
    const audio = makeWav();
    const provider = createXingchenProvider({
      getApiKey: () => 'sk-test',
      fetchImpl: async (url, init) => {
        calls.push({ url, init });
        return jsonResponse({ duration: 1.5, text: ' 你好，世界 ', usage: { type: 'duration', seconds: 2 } });
      },
    });
    const result = await provider.transcribe({ audio, language: 'zh' }, new AbortController().signal);
    assert.equal(result.text, ' 你好，世界 ');
    assert.equal(result.audioSeconds, 1.5);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.siliconflow.cn/v1/audio/transcriptions');
    assert.equal(calls[0].init.method, 'POST');
    assert.equal(calls[0].init.headers.authorization, 'Bearer sk-test');
    const form = calls[0].init.body;
    assert.equal(form.get('model'), XINGCHEN_MODEL);
    const file = form.get('file');
    assert.equal(file.name, 'chunk.wav');
    assert.equal(file.type, 'audio/wav');
    assert.equal(file.size, audio.byteLength);
  });

  await okAsync('响应缺少 duration 时用 WAV 长度估算秒数', async () => {
    const audio = makeWav(16_000);
    const result = await requestXingchenTranscription({
      audio,
      apiKey: 'sk-test',
      baseUrl: 'https://api.siliconflow.cn/v1',
      model: XINGCHEN_MODEL,
      fetchImpl: async () => jsonResponse({ text: 'ok' }),
    });
    assert.equal(result.text, 'ok');
    assert.ok(Math.abs(result.audioSeconds - 1) < 0.01, `audioSeconds=${result.audioSeconds}`);
  });

  await okAsync('HTTP 错误带上状态码、错误码与服务端说明', async () => {
    const provider = createXingchenProvider({
      getApiKey: () => 'sk-bad',
      fetchImpl: async () =>
        jsonResponse({ code: 30014, message: 'Token is invalid.', data: null }, 401),
    });
    await assert.rejects(
      () => provider.transcribe({ audio: makeWav() }, new AbortController().signal),
      (error) => {
        assert.equal(error.status, 401);
        assert.equal(error.code, 30014);
        assert.match(error.message, /401/);
        assert.match(error.message, /Token is invalid\./);
        assert.match(error.message, /密钥无效/);
        return true;
      },
    );
  });

  await okAsync('401 不重试', async () => {
    let count = 0;
    const provider = createXingchenProvider({
      getApiKey: () => 'sk-bad',
      fetchImpl: async () => {
        count += 1;
        return jsonResponse({ code: 30014, message: 'Token is invalid.' }, 401);
      },
    });
    await assert.rejects(() => provider.transcribe({ audio: makeWav() }, new AbortController().signal));
    assert.equal(count, 1);
  });

  await okAsync('5xx 重试一次后成功', async () => {
    let count = 0;
    const provider = createXingchenProvider({
      getApiKey: () => 'sk-test',
      fetchImpl: async () => {
        count += 1;
        if (count === 1) return jsonResponse({ code: 500, message: 'busy' }, 503);
        return jsonResponse({ text: '重试成功', duration: 2 });
      },
    });
    const result = await provider.transcribe({ audio: makeWav() }, new AbortController().signal);
    assert.equal(count, 2);
    assert.equal(result.text, '重试成功');
  });

  await okAsync('没有密钥时 transcribe 直接报错，不发请求', async () => {
    let count = 0;
    const provider = createXingchenProvider({
      getApiKey: () => '',
      fetchImpl: async () => {
        count += 1;
        return jsonResponse({ text: 'x' });
      },
    });
    await assert.rejects(
      () => provider.transcribe({ audio: makeWav() }, new AbortController().signal),
      /API 密钥/,
    );
    assert.equal(count, 0);
  });

  await okAsync('取消信号会中止请求且不重试', async () => {
    const controller = new AbortController();
    controller.abort();
    let count = 0;
    const provider = createXingchenProvider({
      getApiKey: () => 'sk-test',
      fetchImpl: async (url, init) => {
        count += 1;
        if (init.signal?.aborted) throw new Error('aborted');
        return jsonResponse({ text: 'x' });
      },
    });
    await assert.rejects(() => provider.transcribe({ audio: makeWav() }, controller.signal));
    assert.equal(count, 1);
  });
} finally {
  if (savedKey === undefined) delete process.env.SILICONFLOW_API_KEY;
  else process.env.SILICONFLOW_API_KEY = savedKey;
  if (savedBase === undefined) delete process.env.SILICONFLOW_BASE_URL;
  else process.env.SILICONFLOW_BASE_URL = savedBase;
}

console.log(`\n${passed} 项硅基流动 provider 测试通过`);
