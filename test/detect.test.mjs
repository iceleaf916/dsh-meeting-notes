import assert from 'node:assert/strict';
import test from 'node:test';

import { DetectionStateMachine, createMeetingDetector } from '../detect.js';

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function baseConfig(overrides = {}) {
  return {
    detectEnabled: true,
    detectNotify: true,
    detectStartSustainSeconds: 1,
    detectEndGraceSeconds: 5,
    detectCooldownMinutes: 30,
    transcribeMode: 'after',
    ...overrides,
  };
}

function fakeDetectorApi() {
  const instances = [];
  return {
    instances,
    ensureDetector: async () => {},
    startDetector(options) {
      instances.push(options);
      return {
        ready: Promise.resolve(),
        stop: async () => {},
        kill: () => {},
        child: {},
      };
    },
  };
}

function makeRuntime({ config = baseConfig(), api = fakeDetectorApi(), recording = false } = {}) {
  const clock = { now: 1_000 };
  const state = {
    recording,
    recordingTitle: '产品周会',
    started: [],
    stopped: 0,
    detectEvents: [],
  };
  const detector = createMeetingDetector({
    getConfig: () => config,
    isRecording: () => state.recording,
    startRecording: async (options) => {
      state.started.push(options);
      state.recording = true;
      detector.notifyRecordingStarted();
      return { meetingId: 'm1' };
    },
    stopRecording: async () => {
      state.stopped += 1;
      state.recording = false;
      detector.notifyRecordingStopped();
      return { meetingId: 'm1' };
    },
    onDetectChange: (snapshot) => state.detectEvents.push(snapshot),
    getRecordingTitle: () => state.recordingTitle,
    titleFor: (date) => `腾讯会议 ${date.toISOString().slice(0, 16)}`,
    detectorApi: api,
    now: () => clock.now,
  });
  const sample = (active, advance = 0, bundle = 'com.tencent.meeting') => {
    clock.now += advance;
    detector.handleSample({
      at: clock.now,
      apps: [
        {
          pid: 42,
          bundle,
          executable: '',
          input: Boolean(active),
          output: Boolean(active),
          window: true,
        },
      ],
    });
  };
  return { detector, clock, state, api, sample };
}

test('状态机：音频持续 1s 才算开始，短暂占用不触发', () => {
  const machine = new DetectionStateMachine({ sustainMs: 1000, graceMs: 5000 });
  assert.equal(machine.update({ input: false }, 0), null);
  assert.equal(machine.update({ input: true }, 100), null);
  assert.equal(machine.update({ input: true }, 1099), null);
  assert.equal(machine.update({ input: true }, 1100), 'started');
  assert.equal(machine.inMeeting, true);
  assert.equal(machine.startedAt, 100);
});

test('状态机：音频消失持续 grace 才结束，窗口不参与结束判定', () => {
  const machine = new DetectionStateMachine({ sustainMs: 1000, graceMs: 5000 });
  machine.update({ input: true }, 0);
  assert.equal(machine.update({ output: true }, 1000), 'started');
  assert.equal(machine.update({ input: false }, 3000), null);
  assert.equal(machine.update({ input: false }, 7999), null);
  assert.equal(machine.update({ input: false }, 8000), 'ended');
  assert.equal(machine.inMeeting, false);
});

test('状态机：只放音频（只听不说）同样算在会中', () => {
  const machine = new DetectionStateMachine({ sustainMs: 1000, graceMs: 5000 });
  machine.update({ output: true }, 0);
  assert.equal(machine.update({ output: true }, 1000), 'started');
  assert.equal(machine.inMeeting, true);
});

test('控制器：检测到开始后给出「开始记录」建议，接受即开始录音', async () => {
  const { detector, api, state, sample } = makeRuntime();
  await detector.start();
  await flush();
  assert.equal(api.instances.length, 1);
  assert.equal(detector.snapshot().running, true);

  sample(true, 1000);
  sample(true, 1000);
  const suggestion = detector.snapshot().suggestion;
  assert.equal(suggestion.kind, 'start');
  assert.equal(suggestion.appName, '腾讯会议');
  assert.ok(suggestion.title.startsWith('腾讯会议'));

  const result = await detector.ack(suggestion.id, true);
  assert.deepEqual(result, { action: 'start' });
  assert.equal(state.started.length, 1);
  assert.equal(state.started[0].mode, 'after');
  assert.equal(detector.snapshot().suggestion, null);
  detector.dispose();
});

test('控制器：企业微信内置会议（wwmapp 子进程）也能识别，建议文案区分客户端', async () => {
  const { detector, state, sample } = makeRuntime();
  await detector.start();
  await flush();

  sample(true, 1000, 'com.tencent.wwmapp');
  sample(true, 1000, 'com.tencent.wwmapp');
  const suggestion = detector.snapshot().suggestion;
  assert.equal(suggestion.kind, 'start');
  assert.equal(suggestion.app, 'wecom-meeting');
  assert.equal(suggestion.appName, '企业微信会议');
  assert.equal(detector.snapshot().app, 'wecom-meeting');

  const result = await detector.ack(suggestion.id, false);
  assert.deepEqual(result, { action: 'ignored' });
  assert.equal(state.started.length, 0);
  detector.dispose();
});

test('控制器：忽略开始建议会进入冷却，冷却期内不再打扰', async () => {
  const { detector, state, sample, clock } = makeRuntime();
  await detector.start();
  await flush();
  sample(true, 1000);
  sample(true, 1000);
  const suggestion = detector.snapshot().suggestion;
  assert.equal(suggestion.kind, 'start');
  const result = await detector.ack(suggestion.id, false);
  assert.deepEqual(result, { action: 'ignored' });
  assert.equal(state.started.length, 0);
  assert.ok(detector.snapshot().cooldownUntil);

  // 会议结束（没有录音，所以不产生结束建议），再开一场会：仍在冷却期。
  sample(false, 10);
  sample(false, 5000); // ended
  assert.equal(detector.snapshot().inMeeting, false);
  sample(true, 1000);
  sample(true, 1000); // started again
  assert.equal(detector.snapshot().suggestion, null);
  assert.equal(detector.snapshot().inMeeting, true);

  // 冷却结束后再来一场，应重新给建议。
  clock.now += 30 * 60 * 1000;
  sample(false, 10);
  sample(false, 5000); // ended（无录音）
  sample(true, 1000);
  sample(true, 1000);
  assert.equal(detector.snapshot().suggestion?.kind, 'start');
  detector.dispose();
});

test('控制器：录音中会议结束给「结束记录」建议，接受即停止录音', async () => {
  const { detector, state, sample } = makeRuntime({ recording: true });
  await detector.start();
  await flush();
  // 提案开始时状态机需要先进入会中。
  sample(true, 1000);
  sample(true, 1000);
  assert.equal(detector.snapshot().suggestion, null); // 录音中不给开始建议
  sample(false, 10);
  sample(false, 5000);
  const suggestion = detector.snapshot().suggestion;
  assert.equal(suggestion.kind, 'end');
  assert.equal(suggestion.title, '产品周会');

  const result = await detector.ack(suggestion.id, true);
  assert.deepEqual(result, { action: 'stop' });
  assert.equal(state.stopped, 1);
  assert.equal(detector.snapshot().suggestion, null);
  detector.dispose();
});

test('控制器：手动开始录音会清掉过时的开始建议', async () => {
  const { detector, sample } = makeRuntime();
  await detector.start();
  await flush();
  sample(true, 1000);
  sample(true, 1000);
  assert.ok(detector.snapshot().suggestion);
  detector.notifyRecordingStarted();
  assert.equal(detector.snapshot().suggestion, null);
  detector.dispose();
});

test('控制器：过期或无效的建议返回 409', async () => {
  const { detector, clock, sample } = makeRuntime();
  await detector.start();
  await flush();
  sample(true, 1000);
  sample(true, 1000);
  const suggestion = detector.snapshot().suggestion;

  await assert.rejects(
    () => detector.ack('nope', true),
    (error) => error.statusCode === 409,
  );

  clock.now = Date.parse(suggestion.expiresAt) + 1;
  await assert.rejects(
    () => detector.ack(suggestion.id, true),
    (error) => error.statusCode === 409 && error.message === '提醒已过期',
  );
  assert.equal(detector.snapshot().suggestion, null);
  detector.dispose();
});

test('控制器：配置关闭时不启动检测进程', async () => {
  const api = fakeDetectorApi();
  const { detector } = makeRuntime({ config: baseConfig({ detectEnabled: false }), api });
  await detector.start();
  await flush();
  assert.equal(api.instances.length, 0);
  assert.equal(detector.snapshot().running, false);
  assert.equal(detector.snapshot().enabled, false);
  detector.dispose();
});

test('控制器：applyConfig 更新去抖参数后立即生效', async () => {
  const config = baseConfig();
  const runtime = makeRuntime({ config });
  await runtime.detector.start();
  runtime.sample(true, 0);
  runtime.sample(true, 1200);
  assert.equal(runtime.detector.snapshot().suggestion?.kind, 'start');

  config.detectStartSustainSeconds = 5;
  runtime.detector.applyConfig();
  assert.equal(runtime.detector.snapshot().suggestion, null);
  runtime.sample(true, 500);
  runtime.sample(true, 3000);
  assert.equal(runtime.detector.snapshot().suggestion, null);
  runtime.sample(true, 3000);
  assert.equal(runtime.detector.snapshot().suggestion?.kind, 'start');
});
