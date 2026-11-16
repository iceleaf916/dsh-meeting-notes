// Linux 采集与检测的单元测试：不依赖真实声卡的部分全部用注入时钟/假命令验证。
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';

import {
  PcmMixer,
  linuxPlatformInfo,
  linuxTools,
  parsePactlShortList,
  resolveCaptureSources,
} from '../capture-linux.js';
import { linuxDetectorState, startLinuxDetector } from '../detect-linux.js';

function pcm(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  samples.forEach((value, index) => buffer.writeInt16LE(value, index * 2));
  return buffer;
}

function readAll(buffer) {
  const out = [];
  for (let index = 0; index < buffer.length; index += 2) out.push(buffer.readInt16LE(index));
  return out;
}

test('PcmMixer：晚到的流按到达时间补静音，混音不越界', () => {
  const chunks = [];
  let now = 1000;
  const mixer = new PcmMixer({ now: () => now, onPcm: (buffer) => chunks.push(buffer) });
  mixer.addSource('system');
  mixer.addSource('mic');

  // 20ms 一块：system 的 320 个样本在 t=1000 到达，内容覆盖 980–1000ms。
  now = 1000;
  mixer.push('system', pcm(new Array(320).fill(1000)));
  // mic 晚 5ms 到达，内容起点 995ms => 相对 system 的起点偏移 5ms（80 个样本）。
  now = 1005;
  mixer.push('mic', pcm(new Array(320).fill(2000)));

  now = 1030;
  mixer.tick();
  assert.equal(chunks.length, 1);
  const samples = readAll(chunks[0]);
  // system 的内容从 980ms 开始，到 1030ms 共 50ms => 800 个样本。
  assert.equal(samples.length, 800);
  assert.equal(samples[0], 1000);
  assert.equal(samples[79], 1000);
  assert.equal(samples[80], 3000);
  assert.equal(samples[319], 3000);
  assert.equal(samples[320], 2000);
  assert.equal(samples[399], 2000);
  assert.equal(samples[400], 0);
  assert.equal(samples[799], 0);
});

test('PcmMixer：两路相加超过 int16 时截断到边界', () => {
  const chunks = [];
  let now = 0;
  const mixer = new PcmMixer({ now: () => now, onPcm: (buffer) => chunks.push(buffer) });
  mixer.addSource('system');
  mixer.addSource('mic');
  now = 20;
  mixer.push('system', pcm(new Array(320).fill(30000)));
  mixer.push('mic', pcm(new Array(320).fill(30000)));
  now = 40;
  mixer.tick();
  const samples = readAll(chunks[0]);
  assert.equal(samples[0], 32767);
});

test('PcmMixer：只开一路时电平按单路计算', () => {
  const levels = [];
  let now = 0;
  const mixer = new PcmMixer({ now: () => now, onPcm: () => {}, onLevel: (level) => levels.push(level) });
  mixer.addSource('system');
  for (let index = 0; index < 5; index += 1) {
    now += 20;
    mixer.push('system', pcm(new Array(320).fill(16384)));
    mixer.tick();
  }
  assert.equal(levels.length, 1);
  assert.equal(levels[0].system, 0.5);
  assert.equal(levels[0].mic, 0);
  assert.equal(levels[0].rms, 0.5);
});

test('parsePactlShortList：按制表符解析设备名', () => {
  const text = [
    '48\talsa_output.pci-0000_03_00.6.analog-stereo.monitor\tPipeWire\ts32le 2ch 48000Hz\tSUSPENDED',
    '49\talsa_input.pci-0000_03_00.6.analog-stereo\tPipeWire\ts32le 2ch 48000Hz\tSUSPENDED',
  ].join('\n');
  const sources = parsePactlShortList(text);
  assert.deepEqual(
    sources.map((item) => item.name),
    [
      'alsa_output.pci-0000_03_00.6.analog-stereo.monitor',
      'alsa_input.pci-0000_03_00.6.analog-stereo',
    ],
  );
});

test('resolveCaptureSources：优先默认 sink 的 monitor 与默认输入源', async () => {
  const listed = [
    '1\talsa_output.pci.monitor\tPipeWire\ts16le 1ch 16000Hz\tIDLE',
    '2\talsa_input.pci\tPipeWire\ts16le 1ch 16000Hz\tIDLE',
  ].join('\n');
  const run = async (_command, args) => {
    if (args[0] === 'list') return { code: 0, stdout: listed, stderr: '' };
    if (args[0] === 'get-default-sink') return { code: 0, stdout: 'alsa_output.pci\n', stderr: '' };
    if (args[0] === 'get-default-source') return { code: 0, stdout: 'alsa_input.pci\n', stderr: '' };
    return { code: 1, stdout: '', stderr: 'unexpected' };
  };
  const resolved = await resolveCaptureSources({ tools: { pactl: 'pactl' }, run });
  assert.equal(resolved.system, 'alsa_output.pci.monitor');
  assert.equal(resolved.mic, 'alsa_input.pci');
});

test('resolveCaptureSources：设备不存在时报错并列出可用源', async () => {
  const listed = '1\talsa_output.pci.monitor\tPipeWire\ts16le 1ch 16000Hz\tIDLE';
  const run = async (_command, args) => {
    if (args[0] === 'list') return { code: 0, stdout: listed, stderr: '' };
    if (args[0] === 'get-default-sink') return { code: 0, stdout: 'alsa_output.pci\n', stderr: '' };
    return { code: 0, stdout: '', stderr: '' };
  };
  await assert.rejects(
    resolveCaptureSources({
      captureSystemAudio: true,
      captureMicrophone: false,
      env: { DSH_MEETING_SYSTEM_SOURCE: 'nope.monitor' },
      tools: { pactl: 'pactl' },
      run,
    }),
    /可用源/,
  );
});

test('linuxPlatformInfo：本机安装 pactl 后应标记为可用', () => {
  const info = linuxPlatformInfo();
  assert.equal(info.platform, 'linux');
  assert.equal(info.name.startsWith('Linux ('), true);
  if (linuxTools().parec && linuxTools().pactl) {
    assert.equal(info.supported, true);
    assert.equal(info.reason, '');
  }
});

function pulseReachable() {
  if (!linuxTools().pactl) return false;
  try {
    execFileSync('pactl', ['info'], { stdio: 'ignore', timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

test('Linux 检测器：采样契约与停止幂等', async (t) => {
  if (!pulseReachable()) {
    t.skip('没有可用的 pactl / PulseAudio');
    return;
  }
  const state = await linuxDetectorState();
  assert.equal(typeof state.built, 'boolean');
  const samples = [];
  const detector = startLinuxDetector({ intervalMs: 100, onSample: (sample) => samples.push(sample) });
  await detector.ready;
  await new Promise((resolve) => setTimeout(resolve, 400));
  await detector.stop();
  await detector.stop();
  assert.equal(samples.length >= 1, true);
  for (const sample of samples) {
    assert.equal(sample.type, 'sample');
    assert.equal(Array.isArray(sample.apps), true);
    for (const app of sample.apps) {
      assert.equal(typeof app.bundle, 'string');
      assert.equal(typeof app.input, 'boolean');
      assert.equal(typeof app.output, 'boolean');
    }
  }
});
