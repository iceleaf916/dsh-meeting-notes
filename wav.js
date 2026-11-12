// WAV 解析：插件在录音与转写之间以 WAV 字节传递音频，worker 需要 Float32 采样。
//
// 与 qwen3.js 原先的实现完全一致，独立出来供 SenseVoice / Qwen3 两个引擎共用。

/**
 * 解析一段 WAV（PCM 8/16/32-bit，支持 float32）为 Float32 采样。
 */
export function parseWav(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const data = new DataView(view.buffer, view.byteOffset, view.byteLength);
  const tag = (offset) =>
    String.fromCharCode(view[offset], view[offset + 1], view[offset + 2], view[offset + 3]);
  if (view.byteLength < 44 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
    throw new Error('Invalid WAV audio');
  }
  let offset = 12;
  let format = 1;
  let channels = 1;
  let sampleRate = 16_000;
  let bitsPerSample = 16;
  let samplesOffset = -1;
  let samplesBytes = 0;
  while (offset + 8 <= view.byteLength) {
    const id = tag(offset);
    const size = data.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = data.getUint16(body, true);
      channels = data.getUint16(body + 2, true) || 1;
      sampleRate = data.getUint32(body + 4, true) || 16_000;
      bitsPerSample = data.getUint16(body + 14, true) || 16;
      if (format === 0xfffe && size >= 26) format = data.getUint16(body + 24, true) || format;
    } else if (id === 'data') {
      samplesOffset = body;
      samplesBytes = Math.min(size, view.byteLength - body);
    }
    offset = body + size + (size % 2);
  }
  if (samplesOffset < 0 || samplesBytes <= 0) throw new Error('WAV audio has no samples');
  if (format !== 1 && format !== 3) throw new Error(`Unsupported WAV format ${format}`);
  const bytesPerSample = bitsPerSample / 8;
  const frames = Math.floor(samplesBytes / (bytesPerSample * channels));
  const samples = new Float32Array(frames);
  for (let frame = 0; frame < frames; frame += 1) {
    const start = samplesOffset + frame * bytesPerSample * channels;
    if (format === 3 && bitsPerSample === 32) samples[frame] = data.getFloat32(start, true);
    else if (bitsPerSample === 16) samples[frame] = data.getInt16(start, true) / 32768;
    else if (bitsPerSample === 32) samples[frame] = data.getInt32(start, true) / 2147483648;
    else if (bitsPerSample === 8) samples[frame] = (view[start] - 128) / 128;
    else throw new Error(`Unsupported WAV bit depth ${bitsPerSample}`);
  }
  if (channels > 1) {
    const mono = new Float32Array(frames);
    for (let frame = 0; frame < frames; frame += 1) {
      const start = frame * channels;
      let sum = 0;
      for (let channel = 0; channel < channels; channel += 1) sum += samples[start + channel];
      mono[frame] = sum / channels;
    }
    return { sampleRate, samples: mono };
  }
  return { sampleRate, samples };
}
