// Qwen3-ASR 推理 worker：模型加载和同步解码都放在这里，
// 这样主进程（DSH）不会因为几秒钟的 CPU 推理而卡住 UI / HTTP 接口。
import { parentPort } from 'node:worker_threads';
import sherpa from 'sherpa-onnx-node';

let recognizer = null;

function describe(error) {
  return error instanceof Error ? error.message : String(error);
}

parentPort.on('message', (message) => {
  if (!message || typeof message !== 'object') return;
  if (message.type === 'load') {
    try {
      recognizer = new sherpa.OfflineRecognizer(message.config);
      parentPort.postMessage({ type: 'loaded' });
    } catch (error) {
      recognizer = null;
      parentPort.postMessage({ type: 'error', id: 'load', message: describe(error) });
    }
    return;
  }
  if (message.type === 'transcribe') {
    try {
      if (!recognizer) throw new Error('模型尚未加载');
      const stream = recognizer.createStream();
      stream.acceptWaveform({ sampleRate: message.sampleRate, samples: new Float32Array(message.samples) });
      recognizer.decode(stream);
      const result = recognizer.getResult(stream);
      parentPort.postMessage({ type: 'result', id: message.id, text: (result && result.text) || '' });
    } catch (error) {
      parentPort.postMessage({ type: 'error', id: message.id, message: describe(error) });
    }
    return;
  }
  if (message.type === 'close') {
    recognizer = null;
    parentPort.close();
  }
});
