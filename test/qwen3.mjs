// Qwen3-ASR provider 的纯逻辑测试：不联网、不加载模型。
import { strict as assert } from 'node:assert';
import { splitPcm, ASR_CONSTANTS } from '../asr.js';
import { classifyDownloadFailure, createQwen3Provider, parseWav } from '../qwen3.js';

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

function makeWav(samples, sampleRate = 16_000) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i += 1) {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), i * 2);
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
  return Buffer.concat([header, data]);
}

// 1) WAV 解析：16k 单声道 16bit，1 秒。
ok('parseWav 解析 RIFF/WAVE 头与采样', () => {
  const samples = new Float32Array(16_000);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.sin(i / 10) * 0.5;
  const parsed = parseWav(makeWav(samples));
  assert.equal(parsed.sampleRate, 16_000);
  assert.equal(parsed.samples.length, 16_000);
  assert.ok(Math.abs(parsed.samples[5] - samples[5]) < 0.001);
});

ok('parseWav 拒绝非 WAV 数据', () => {
  assert.throws(() => parseWav(Buffer.from('not a wav file')), /WAV|RIFF|格式/i);
});

// 2) 切块上限：Qwen3 单次推理窗口 30s，splitPcm 必须遵守 maxChunkSeconds。
ok('splitPcm 遵守 maxChunkSeconds=30 上限', () => {
  const pcm = Buffer.alloc(60 * 32_000); // 60 秒静音
  const chunks = splitPcm(pcm, { chunkSeconds: 25, maxChunkSeconds: 30 });
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) assert.ok(chunk.durationSec <= 30.0001, `chunk ${chunk.durationSec}s 超过上限`);
  const total = chunks.reduce((sum, chunk) => sum + chunk.durationSec, 0);
  assert.ok(Math.abs(total - 60) < 0.5);
});

ok('splitPcm 默认上限仍是 50s（不影响 SenseVoice）', () => {
  const pcm = Buffer.alloc(40 * 32_000);
  const chunks = splitPcm(pcm, { chunkSeconds: 25 });
  assert.ok(chunks.length >= 1);
  for (const chunk of chunks) assert.ok(chunk.durationSec <= 50.0001);
});

// 3) 下载错误归类：把底层网络错误变成可展示的 reason。
ok('classifyDownloadFailure 归类 DNS / 超时 / 存储', () => {
  const dns = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' });
  assert.equal(classifyDownloadFailure(dns).reason, 'dns');
  const timeout = Object.assign(new Error('timed out'), { name: 'TimeoutError' });
  assert.equal(classifyDownloadFailure(timeout).reason, 'timeout');
  const storage = Object.assign(new Error('EACCES'), { code: 'EACCES' });
  assert.equal(classifyDownloadFailure(storage).reason, 'storage');
  assert.equal(classifyDownloadFailure(null).reason, 'unknown');
});

// 4) provider 元数据与未准备状态（模型目录不存在）。
await okAsync('provider 暴露模型列表需要的元数据', async () => {
  const modelRoot = `/tmp/dsh-qwen3-test-${Date.now()}`;
  const provider = createQwen3Provider({ modelRoot, threads: 2 });
  try {
    assert.equal(provider.info.id, 'qwen3-asr-0.6b');
    assert.match(provider.info.name, /Qwen3-ASR/);
    assert.equal(provider.info.location, 'host-local');
    assert.ok(provider.info.languages.includes('zh'));
    assert.equal(provider.info.maxChunkSeconds, 30);
    assert.equal(provider.info.realtime, false);
    assert.deepEqual(provider.info.downloadSources, ['https://modelscope.cn', 'https://hf-mirror.com']);
    assert.ok(provider.info.setupEstimate.recommendedDiskBytes > 1e9);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(provider.preparation.snapshot().phase, 'unprepare');
    await assert.rejects(
      () => provider.transcribe({ audio: makeWav(new Float32Array(16_000)), language: 'zh' }, new AbortController().signal),
      /尚未准备/,
    );
  } finally {
    await provider.dispose();
  }
});

ok('ASR 采样率与帧长保持 16k/20ms', () => {
  assert.equal(ASR_CONSTANTS.SAMPLE_RATE, 16_000);
  assert.equal(ASR_CONSTANTS.FRAME_BYTES, 640);
});

console.log(`\nQWEN3 OK (${passed} checks)`);
