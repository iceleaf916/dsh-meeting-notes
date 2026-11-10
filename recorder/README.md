# meeting-recorder（macOS 录音辅助程序）

会议记录插件的原生录音进程：系统音频（ScreenCaptureKit）+ 麦克风（AVAudioEngine）
逐样本混音，输出 16kHz 单声道 s16le 裸 PCM 给 Host（`capture.js`）。
不依赖任何第三方库，无 SPM 工程，单个 `main.swift` 由 `swiftc` 直接编译。

## 构建

```bash
cd dsh-meeting-notes/recorder
bash build.sh                 # 产物：.build/meeting-recorder
bash build.sh /tmp/foobar     # 可选参数：自定义产物路径（Host 的 ensureRecorder 会这样传）
```

- 需要 Xcode Command Line Tools（`swiftc`），macOS 13+。
- 必须使用 `-module-cache-path` / `-Xcc -fmodules-cache-path` 指向 `.build/module-cache`
  （本机 sandbox 下默认 clang module cache 不可写，构建会失败）。
- `.build/` 已由 `dsh-meeting-notes/.gitignore` 忽略。

## 运行协议

```bash
.build/meeting-recorder --sample-rate 16000 --system 1 --mic 1
```

| 参数 | 说明 |
|---|---|
| `--sample-rate` | 输出采样率，8000–48000，默认 16000 |
| `--system 0\|1` | 是否采集系统音频，默认 1 |
| `--mic 0\|1` | 是否采集麦克风，默认 1 |

- 两路都为 0 → `error` JSON + 退出码 2。
- **stdout**：裸 PCM，`s16le` + 单声道 + `--sample-rate`，连续写入，无分块头/WAV 头
  （WAV 头由 Host 封装）。
- **stderr**：每行一个 JSON 对象，无其它输出：
  - `{"type":"ready","system":true,"mic":true,"sampleRate":16000}` 采集已启动
  - `{"type":"level","system":0.12,"mic":0.34,"rms":0.30}` 约 10Hz（RMS，0–1 已 clamp）
  - `{"type":"error","message":"中文原因"}` 失败原因，随后以非 0 退出
  - `{"type":"stopped"}` 正常停止、flush 完成，随后 exit 0
- **停止**：stdin 读到 `{"cmd":"stop"}`、stdin EOF、SIGINT 或 SIGTERM → 停止采集、
  排空混音缓冲、输出 `stopped`、exit 0。stdout 被对端关闭（EPIPE）也按停止处理。

处理管线：各采集源 → 降混单声道（各声道取平均）→ 重采样到目标采样率
（整数比取平均，如 48000→16000 取 3 个平均；非整数比线性插值）→ 逐样本相加 →
clamp 到 [-1,1] → s16le。不做自动增益、不做降噪。采集回调里只做转换与入队，
混音与写 stdout 在独立线程，避免阻塞音频回调。

## 自测

```bash
bash test.sh
```

会在播放提示音的同时录 5 秒（系统音频 + 麦克风），校验 PCM 非静音（peak > 0.05）、
时长与实际耗时一致、stderr 全部为合法 JSON 且 ready/level/stopped 齐全，并覆盖
参数校验、stdin EOF、SIGINT 停止。依赖 `python3` 分析 PCM；无 `afplay` 时自动跳过放音
（此时非静音断言可能失败）。需要「屏幕录制」与「麦克风」TCC 权限。

实测（Apple Silicon / macOS 26.6，系统音频 + 麦克风，播放 `Submarine.aiff` 6 次）：
录得 90880 帧 / 5.680s（宿主计时约 5.9s）、peak 0.492、rms 0.089；stderr 56 行
（ready 1、level 54 ≈ 9.5Hz、stopped 1），全部为合法 JSON。`ready` 延迟 0.35–0.55s；
`{"cmd":"stop"}` 到进程退出 17–84ms（Host 宽限 8s）；20s 连续录制得 20.22s PCM
（100.1% 实时率）。`--sample-rate` 8000/16000/22050/44100/48000 实测时长均正确。

## 已知限制

- 仅 macOS 13+（`SCStreamConfiguration.capturesAudio` 所需）；其它平台未实现。
- 需要「屏幕录制」权限（系统音频）与「麦克风」权限；未授权时输出 `error` 并退出 1，
  Host 会把 `message` 转成中文提示。
- 双源同时开启时按「两路都已到货的帧数」混音：某个源异常停摆会阻塞输出，
  直到 SCK 报错或用户停止（正常场景 SCK / 麦克风都会持续送静音帧，不受影响）。
- 启动到就绪约 0.2–0.4s（TCC 检查 + 流启动）；就绪前已入队的少量音频会被一起写出，
  因此 PCM 时长比「ready 之后」的实际等待时间长约 0.1–0.2s（首尾不丢音）。
- stdin 为 `/dev/null` 时会立即 EOF，从而立刻停止——这是契约要求的 EOF 语义，
  自测/手工运行请用管道或终端保持 stdin 打开。
