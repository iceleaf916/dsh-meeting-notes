/**
 * 会议记录插件的存储层：配置归一化、会议目录读写、WAV 落盘、文稿渲染。
 *
 * 目录结构（<storageDir> 默认 ~/dsh-meetings）：
 *   <meetingId>/meeting.json     会议元数据与分段
 *   <meetingId>/audio.wav        16kHz / mono / s16le 混音录音
 *   <meetingId>/transcript.md    带时间戳的转写文稿
 *   <meetingId>/minutes.md       由 DSH 模型生成的会议纪要（模型写入，本层只读）
 */

import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export const SAMPLE_RATE = 16000;
export const BYTES_PER_SECOND = SAMPLE_RATE * 2; // s16le mono

export const DEFAULT_CONFIG = {
  storageDir: '~/dsh-meetings',
  transcribeMode: 'after',
  language: 'zh',
  providerId: 'sensevoice-local',
  captureSystemAudio: true,
  captureMicrophone: true,
  chunkSeconds: 25,
  // 会议检测（腾讯会议开始/结束提醒）。检测只读取音频占用状态，不读音频内容。
  detectEnabled: true,
  detectNotify: true,
  detectStartSustainSeconds: 2,
  detectEndGraceSeconds: 12,
  detectCooldownMinutes: 30,
};

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.round(number)));
}

const MODES = new Set(['after', 'realtime']);
const LANGUAGES = new Set(['zh', 'en', 'auto', 'yue', 'ja', 'ko']);

export function expandHome(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

export function normalizeConfig(input, fallback = DEFAULT_CONFIG) {
  const source = input && typeof input === 'object' ? input : {};
  const base = fallback && typeof fallback === 'object' ? fallback : DEFAULT_CONFIG;
  const pick = (key) => (source[key] === undefined ? base[key] : source[key]);

  const rawDir = expandHome(pick('storageDir'));
  if (!rawDir) throw new Error('存储目录不能为空');
  const storageDir = path.resolve(rawDir);

  const mode = String(pick('transcribeMode') || 'after');
  if (!MODES.has(mode)) throw new Error('转写模式只能是「结束后转写」或「实时转写」');

  const language = String(pick('language') || 'zh');
  if (!LANGUAGES.has(language)) throw new Error('不支持的语言');

  const providerId = String(pick('providerId') || 'sensevoice-local').trim();
  if (!providerId) throw new Error('本地识别服务不能为空');

  const chunkRaw = Number(pick('chunkSeconds'));
  const chunkSeconds = Number.isFinite(chunkRaw) ? Math.min(60, Math.max(8, Math.round(chunkRaw))) : 25;

  const captureSystemAudio = pick('captureSystemAudio') !== false;
  const captureMicrophone = pick('captureMicrophone') !== false;
  if (!captureSystemAudio && !captureMicrophone) {
    throw new Error('系统音频和麦克风至少要开启一个');
  }

  const detectEnabled = pick('detectEnabled') !== false;
  const detectNotify = pick('detectNotify') !== false;
  const detectStartSustainSeconds = clampNumber(pick('detectStartSustainSeconds'), 2, 1, 10);
  const detectEndGraceSeconds = clampNumber(pick('detectEndGraceSeconds'), 12, 5, 60);
  const detectCooldownMinutes = clampNumber(pick('detectCooldownMinutes'), 30, 1, 180);

  return {
    storageDir,
    transcribeMode: mode,
    language,
    providerId,
    captureSystemAudio,
    captureMicrophone,
    chunkSeconds,
    detectEnabled,
    detectNotify,
    detectStartSustainSeconds,
    detectEndGraceSeconds,
    detectCooldownMinutes,
  };
}

export async function ensureStorageDir(dir) {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function storageStatus(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.access(dir, (await import('node:fs')).constants?.W_OK ?? 2);
    return { dir, exists: true, writable: true };
  } catch {
    return { dir, exists: false, writable: false };
  }
}

function pad(value) {
  return String(value).padStart(2, '0');
}

export function meetingId(date = new Date()) {
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .padStart(4, '0');
  return `${stamp}-${suffix}`;
}

export function defaultTitle(date = new Date()) {
  return `会议 ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatClock(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function meetingDir(root, id) {
  return path.join(root, id);
}

export async function createMeeting(root, { title, mode, language, providerId }) {
  const id = meetingId();
  const dir = meetingDir(root, id);
  await fs.mkdir(dir, { recursive: true });
  const startedAt = new Date();
  const meta = {
    id,
    title: String(title || '').trim() || defaultTitle(startedAt),
    startedAt: startedAt.toISOString(),
    endedAt: '',
    durationSec: 0,
    mode,
    language,
    providerId,
    status: 'recording',
    segments: [],
    error: '',
  };
  await writeMeeting(dir, meta);
  return { id, dir, meta };
}

export async function writeMeeting(dir, meta) {
  await fs.writeFile(path.join(dir, 'meeting.json'), `${JSON.stringify(meta, null, 2)}\n`, 'utf8');
}

export async function readMeeting(dir) {
  const text = await fs.readFile(path.join(dir, 'meeting.json'), 'utf8');
  return JSON.parse(text);
}

export async function readMeetingByPath(root, id) {
  if (!/^[0-9a-zA-Z-]+$/.test(id)) throw new Error('会议编号不合法');
  const dir = meetingDir(root, id);
  const meta = await readMeeting(dir);
  return { ...meta, dir };
}

export async function deleteMeeting(root, id) {
  if (!/^[0-9a-zA-Z-]+$/.test(id)) throw new Error('会议编号不合法');
  await fs.rm(meetingDir(root, id), { recursive: true, force: true });
}

export async function listMeetings(root) {
  let entries;
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return [];
  }
  const meetings = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^[0-9]{8}-[0-9]{6}-[0-9a-f]{4}$/.test(entry.name)) continue;
    const dir = path.join(root, entry.name);
    try {
      const meta = await readMeeting(dir);
      const stat = await fs.stat(path.join(dir, 'audio.wav')).catch(() => null);
      const minutes = await fs.stat(path.join(dir, 'minutes.md')).catch(() => null);
      meetings.push({
        id: meta.id,
        title: meta.title,
        startedAt: meta.startedAt,
        durationSec: meta.durationSec || 0,
        mode: meta.mode,
        language: meta.language,
        status: meta.status,
        transcriptChars: (meta.segments || []).reduce((sum, segment) => sum + String(segment.text || '').length, 0),
        hasMinutes: Boolean(minutes && minutes.size > 0),
        sizeBytes: stat ? stat.size : 0,
        error: meta.error || '',
      });
    } catch {
      // 目录损坏或半成品，跳过
    }
  }
  meetings.sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
  return meetings;
}

/** 逐帧检查 PCM（s16le mono）能量，返回每个窗口的 RMS。 */
export function pcmLevel(chunk) {
  const count = Math.floor(chunk.length / 2);
  if (!count) return 0;
  let sum = 0;
  for (let i = 0; i < count; i += 1) {
    const value = chunk.readInt16LE(i * 2) / 32768;
    sum += value * value;
  }
  return Math.sqrt(sum / count);
}

/** 把裸 PCM（s16le mono 16kHz）包上 WAV 头。 */
export function wavHeader(dataBytes, { sampleRate = SAMPLE_RATE, channels = 1, bits = 16 } = {}) {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + dataBytes, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(dataBytes, 40);
  return header;
}

/** 流式 WAV 写入：先占位 44 字节头，关闭时回填真实长度与时长。 */
export class WavSink {
  constructor(file) {
    this.file = file;
    this.bytes = 0;
    this.stream = null;
    this.headerWritten = false;
  }

  async open() {
    this.stream = createWriteStream(this.file, { flags: 'w' });
    await new Promise((resolve, reject) => {
      this.stream.once('open', resolve);
      this.stream.once('error', reject);
    });
    this.stream.write(wavHeader(0));
    this.headerWritten = true;
    return this;
  }

  write(chunk) {
    if (!chunk || !chunk.length) return;
    this.bytes += chunk.length;
    this.stream.write(chunk);
  }

  async close() {
    if (!this.stream) return this.bytes;
    await new Promise((resolve) => this.stream.end(resolve));
    const handle = await fs.open(this.file, 'r+');
    try {
      const head = wavHeader(this.bytes);
      await handle.write(head, 0, head.length, 0);
    } finally {
      await handle.close();
    }
    this.stream = null;
    return this.bytes;
  }

  get durationSec() {
    return this.bytes / BYTES_PER_SECOND;
  }
}

/** 读回 wav 的 PCM 数据（跳过 44 字节头）。 */
export async function readWavPcm(file) {
  const buffer = await fs.readFile(file);
  if (buffer.length <= 44) return Buffer.alloc(0);
  // 头里可能带额外 chunk；标准写入固定 44 字节，这里兼容查找 data 标记。
  const marker = buffer.indexOf('data', 12, 'ascii');
  const offset = marker >= 0 ? marker + 8 : 44;
  return buffer.subarray(Math.min(offset, buffer.length));
}

export function renderTranscript(meta, segments) {
  const lines = [`# ${meta.title}`, ''];
  const started = meta.startedAt ? new Date(meta.startedAt) : null;
  const startedText = started
    ? `${started.getFullYear()}-${pad(started.getMonth() + 1)}-${pad(started.getDate())} ${pad(started.getHours())}:${pad(started.getMinutes())}`
    : '';
  lines.push(`- 时间：${startedText}`);
  lines.push(`- 时长：${formatClock(meta.durationSec)}`);
  lines.push(`- 模式：${meta.mode === 'realtime' ? '实时转写' : '录音后转写'}`);
  lines.push(`- 语言：${meta.language}`);
  lines.push(`- 识别：SenseVoiceSmall (INT8)，本地离线`);
  lines.push('');
  lines.push('## 转写');
  lines.push('');
  if (!segments.length) {
    lines.push('_（没有识别到语音内容）_');
  } else {
    for (const segment of segments) {
      const text = String(segment.text || '').trim();
      if (!text) continue;
      lines.push(`[${formatClock(segment.fromSec)}] ${text}`);
      lines.push('');
    }
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

export function parseSegmentsFromMarkdown(markdown) {
  const segments = [];
  for (const line of String(markdown || '').split('\n')) {
    const match = /^\[(\d{2}:\d{2}(?::\d{2})?)\]\s*(.+)$/.exec(line.trim());
    if (!match) continue;
    segments.push({ fromSec: clockToSeconds(match[1]), toSec: clockToSeconds(match[1]), text: match[2] });
  }
  return segments;
}

function clockToSeconds(text) {
  const parts = text.split(':').map((value) => Number(value));
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}
