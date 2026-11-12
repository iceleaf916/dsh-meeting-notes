// SenseVoiceSmall 本地识别 provider（插件自带，不依赖 DSH 语音输入插件）。
//
// 默认复用 DSH 语音插件已经下载过的模型目录（~/.dsh/speech-to-text/sensevoice/
// models/sensevoice-onnx），避免用户为同一个模型再下 230MB；目录可用
// sensevoiceModelDir 配置覆盖。下载/校验/加载状态机与 worker 推理复用 model-runtime.js。
import { homedir } from 'node:os';
import { join } from 'node:path';

import { createModelProvider, ModelPreparation } from './model-runtime.js';

export const SENSEVOICE_PROVIDER_ID = 'sensevoice-local';
export const SENSEVOICE_MODEL_NAME = 'SenseVoiceSmall';

const WORKER_URL = new URL('./asr-worker.js', import.meta.url);
const MODEL_ROOT_DEFAULT = join(
  process.env.DSH_HOME ? process.env.DSH_HOME : join(homedir(), '.dsh'),
  'speech-to-text',
  'sensevoice',
  'models',
  'sensevoice-onnx',
);

// 与 DSH 语音插件锁定同一份上游资源（sherpa-onnx 官方仓库的固定 commit），
// 保证两边下载到的字节完全一致，sha256 才能作为完整性校验。
const MODEL_REPO = 'csukuangfj/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-2024-07-17';
const MODEL_COMMIT = '2365baeacb507f821a0c8120fcee3d484dba7a07';

export const SENSEVOICE_FILES = [
  {
    path: 'model.int8.onnx',
    bytes: 239_233_841,
    sha256: 'c71f0ce00bec95b07744e116345e33d8cbbe08cef896382cf907bf4b51a2cd51',
    huggingface: 'model.int8.onnx',
  },
  {
    path: 'tokens.txt',
    bytes: 315_894,
    sha256: 'f449eb28dc567533d7fa59be34e2abca8784f771850c78a47fb731a31429a1dc',
    huggingface: 'tokens.txt',
  },
];

export const SENSEVOICE_DOWNLOAD_SOURCES = [
  {
    origin: 'https://huggingface.co',
    base: `https://huggingface.co/${MODEL_REPO}/resolve/${MODEL_COMMIT}`,
    layout: 'huggingface',
  },
  {
    origin: 'https://hf-mirror.com',
    base: `https://hf-mirror.com/${MODEL_REPO}/resolve/${MODEL_COMMIT}`,
    layout: 'huggingface',
  },
];

const LANGUAGES = ['auto', 'zh', 'en', 'yue', 'ja', 'ko'];

export class SenseVoicePreparation extends ModelPreparation {
  constructor(options = {}) {
    super({
      modelRoot: options.modelRoot ? options.modelRoot : MODEL_ROOT_DEFAULT,
      threads: options.threads ? options.threads : 2,
      assets: SENSEVOICE_FILES,
      sources: SENSEVOICE_DOWNLOAD_SOURCES,
      workerUrl: WORKER_URL,
      label: 'SenseVoice',
      nativeConfig: (modelRoot, threads) => ({
        featConfig: { sampleRate: 16_000, featureDim: 80 },
        modelConfig: {
          // language 在 recognizer 加载时固定；用 auto 让同一实例覆盖中文/英文/粤语等，
          // 避免每次会议切换语言都重新加载 230MB 模型。
          senseVoice: {
            model: join(modelRoot, 'model.int8.onnx'),
            language: 'auto',
            useInverseTextNormalization: 1,
          },
          tokens: join(modelRoot, 'tokens.txt'),
          numThreads: threads,
          provider: 'cpu',
          debug: 0,
        },
      }),
    });
  }
}

/** provider 元信息；构造失败时也用它生成「失败占位行」，保证模型列表不消失。 */
export const SENSEVOICE_PROVIDER_INFO = {
  id: SENSEVOICE_PROVIDER_ID,
  name: `${SENSEVOICE_MODEL_NAME} (INT8)`,
  languages: LANGUAGES,
  downloadSources: SENSEVOICE_DOWNLOAD_SOURCES.map((source) => source.origin),
  setupEstimate: {
    recommendedDiskBytes: 1_000_000_000,
    expectedMemoryBytes: 1_000_000_000,
    minimumMinutes: 1,
    maximumMinutes: 10,
  },
};

/** 构造 SenseVoice provider。 */
export function createSenseVoiceProvider(options = {}) {
  return createModelProvider({
    ...SENSEVOICE_PROVIDER_INFO,
    preparation: new SenseVoicePreparation(options),
  });
}
