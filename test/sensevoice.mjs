// SenseVoice provider 的元数据/资源锁测试：不联网、不加载模型。
import { strict as assert } from 'node:assert';

import {
  SENSEVOICE_DOWNLOAD_SOURCES,
  SENSEVOICE_FILES,
  SENSEVOICE_PROVIDER_ID,
  SENSEVOICE_PROVIDER_INFO,
  SenseVoicePreparation,
  createSenseVoiceProvider,
} from '../sensevoice.js';

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

const provider = createSenseVoiceProvider({ modelRoot: '/tmp/dsh-meeting-notes-missing-model' });

ok('provider 元数据与 DSH 语音插件的 SenseVoice 一致', () => {
  assert.equal(provider.info.id, SENSEVOICE_PROVIDER_ID);
  assert.match(provider.info.name, /SenseVoiceSmall/);
  assert.equal(provider.info.location, 'host-local');
  assert.ok(provider.info.languages.includes('zh'));
  assert.ok(provider.info.languages.includes('auto'));
  assert.deepEqual(provider.info.downloadSources, ['https://huggingface.co', 'https://hf-mirror.com']);
  assert.ok(provider.info.setupEstimate.recommendedDiskBytes >= 200_000_000);
  // SenseVoice 是流式友好的整段模型：不设 maxChunkSeconds，允许实时模式。
  assert.equal(provider.info.maxChunkSeconds, undefined);
  assert.equal(provider.info.realtime, undefined);
});

ok('模型文件锁定上游固定 commit 与 sha256', () => {
  assert.equal(SENSEVOICE_FILES.length, 2);
  const model = SENSEVOICE_FILES.find((file) => file.path === 'model.int8.onnx');
  assert.equal(model.bytes, 239_233_841);
  assert.match(model.sha256, /^[0-9a-f]{64}$/);
  const tokens = SENSEVOICE_FILES.find((file) => file.path === 'tokens.txt');
  assert.equal(tokens.bytes, 315_894);
  for (const source of SENSEVOICE_DOWNLOAD_SOURCES) {
    assert.match(source.base, /resolve\/[0-9a-f]{40}$/);
    assert.equal(source.layout, 'huggingface');
  }
  assert.deepEqual(
    SENSEVOICE_DOWNLOAD_SOURCES.map((source) => source.origin),
    ['https://huggingface.co', 'https://hf-mirror.com'],
  );
});

ok('默认模型目录复用 DSH 已下载的 SenseVoice 路径', () => {
  const preparation = new SenseVoicePreparation();
  assert.match(preparation.modelRoot, /speech-to-text[\\/]sensevoice[\\/]models[\\/]sensevoice-onnx$/);
  const custom = new SenseVoicePreparation({ modelRoot: '/tmp/custom' });
  assert.equal(custom.modelRoot, '/tmp/custom');
});

ok('sherpa-onnx 配置：language=auto + ITN，避免按会议语言反复重载模型', () => {
  const preparation = new SenseVoicePreparation({ modelRoot: '/tmp/models', threads: 3 });
  const config = preparation.nativeConfig();
  assert.equal(config.featConfig.sampleRate, 16_000);
  assert.equal(config.featConfig.featureDim, 80);
  assert.equal(config.modelConfig.senseVoice.language, 'auto');
  assert.equal(config.modelConfig.senseVoice.useInverseTextNormalization, 1);
  assert.equal(config.modelConfig.numThreads, 3);
  assert.equal(config.modelConfig.senseVoice.model, '/tmp/models/model.int8.onnx');
  assert.equal(config.modelConfig.tokens, '/tmp/models/tokens.txt');
});

ok('SENSEVOICE_PROVIDER_INFO 与 createSenseVoiceProvider 的 info 一致（失败占位行复用）', () => {
  assert.deepEqual({ ...provider.info }, { location: 'host-local', ...SENSEVOICE_PROVIDER_INFO });
});

await provider.dispose();

console.log(`\nSENSEVOICE OK (${passed} checks)`);
