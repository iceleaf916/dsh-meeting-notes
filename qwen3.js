// Qwen3-ASR 本地识别 provider（插件自带，不依赖 DSH 语音输入插件）。
//
// 下载/校验/加载状态机与 worker 推理都复用 model-runtime.js，这里只提供
// Qwen3 的模型文件清单、下载源与 sherpa-onnx recognizer 配置。
import { homedir } from 'node:os';
import { join } from 'node:path';

import { createModelProvider, ModelPreparation } from './model-runtime.js';

export { classifyDownloadFailure, SpeechDownloadError } from './model-runtime.js';
export { parseWav } from './wav.js';

export const QWEN3_PROVIDER_ID = 'qwen3-asr-0.6b';
export const QWEN3_MODEL_NAME = 'Qwen3-ASR-0.6B';

const WORKER_URL = new URL('./asr-worker.js', import.meta.url);
const MODEL_ROOT_DEFAULT = join(
  process.env.DSH_HOME ? process.env.DSH_HOME : join(homedir(), '.dsh'),
  'speech-to-text',
  'qwen3-asr-0.6b',
);

const MODEL_ORIGIN_MODELSCOPE = 'https://modelscope.cn';
const MODEL_ORIGIN_HF_MIRROR = 'https://hf-mirror.com';

// 每个文件同时记录两个下载源的相对路径：ModelScope 的仓库布局按 model_0.6B/
// tokenizer/ 分目录，Hugging Face 镜像仓库则把 onnx 放在根目录。
export const QWEN3_FILES = [
  {
    path: 'conv_frontend.onnx',
    bytes: 44_148_281,
    modelscope: 'model_0.6B/conv_frontend.onnx',
    huggingface: 'conv_frontend.onnx',
  },
  {
    path: 'encoder.int8.onnx',
    bytes: 182_491_662,
    modelscope: 'model_0.6B/encoder.int8.onnx',
    huggingface: 'encoder.int8.onnx',
  },
  {
    path: 'decoder.int8.onnx',
    bytes: 755_914_231,
    modelscope: 'model_0.6B/decoder.int8.onnx',
    huggingface: 'decoder.int8.onnx',
  },
  {
    path: 'tokenizer/vocab.json',
    bytes: 2_776_833,
    modelscope: 'tokenizer/vocab.json',
    huggingface: 'tokenizer/vocab.json',
  },
  {
    path: 'tokenizer/merges.txt',
    bytes: 1_671_853,
    modelscope: 'tokenizer/merges.txt',
    huggingface: 'tokenizer/merges.txt',
  },
  {
    path: 'tokenizer/tokenizer_config.json',
    bytes: 12_487,
    modelscope: 'tokenizer/tokenizer_config.json',
    huggingface: 'tokenizer/tokenizer_config.json',
  },
];

export const QWEN3_DOWNLOAD_SOURCES = [
  {
    origin: MODEL_ORIGIN_MODELSCOPE,
    base: 'https://modelscope.cn/models/zengshuishui/Qwen3-ASR-onnx/resolve/master',
    layout: 'modelscope',
  },
  {
    origin: MODEL_ORIGIN_HF_MIRROR,
    base: 'https://hf-mirror.com/csukuangfj2/sherpa-onnx-qwen3-asr-0.6B-int8-2026-03-25/resolve/main',
    layout: 'huggingface',
  },
];

const LANGUAGES = ['auto', 'zh', 'en', 'yue', 'ja', 'ko'];

export class Qwen3Preparation extends ModelPreparation {
  constructor(options = {}) {
    super({
      modelRoot: options.modelRoot ? options.modelRoot : MODEL_ROOT_DEFAULT,
      threads: options.threads ? options.threads : 2,
      assets: QWEN3_FILES,
      sources: QWEN3_DOWNLOAD_SOURCES,
      workerUrl: WORKER_URL,
      label: 'Qwen3-ASR',
      nativeConfig: (modelRoot, threads) => ({
        featConfig: { sampleRate: 16_000, featureDim: 80 },
        modelConfig: {
          qwen3Asr: {
            convFrontend: join(modelRoot, 'conv_frontend.onnx'),
            encoder: join(modelRoot, 'encoder.int8.onnx'),
            decoder: join(modelRoot, 'decoder.int8.onnx'),
            tokenizer: join(modelRoot, 'tokenizer'),
            hotwords: '',
          },
          tokens: '',
          numThreads: threads,
          provider: 'cpu',
          debug: 0,
        },
      }),
    });
  }
}

/** provider 元信息；构造失败时也用它生成「失败占位行」，保证模型列表不消失。 */
export const QWEN3_PROVIDER_INFO = {
  id: QWEN3_PROVIDER_ID,
  name: `${QWEN3_MODEL_NAME} (INT8)`,
  languages: LANGUAGES,
  downloadSources: QWEN3_DOWNLOAD_SOURCES.map((source) => source.origin),
  setupEstimate: {
    recommendedDiskBytes: 1_150_000_000,
    expectedMemoryBytes: 1_600_000_000,
    minimumMinutes: 3,
    maximumMinutes: 25,
  },
  maxChunkSeconds: 30,
  realtime: false,
};

/** 构造 Qwen3-ASR provider。 */
export function createQwen3Provider(options = {}) {
  return createModelProvider({
    ...QWEN3_PROVIDER_INFO,
    preparation: new Qwen3Preparation(options),
  });
}
