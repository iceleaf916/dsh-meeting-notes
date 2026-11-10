# 会议记录 · 本地录音与转写

一个 DSH Web 插件：左侧栏「会议记录」入口，把「系统声音 + 麦克风」混音录下来，用本地 SenseVoiceSmall (INT8) 转成中文文稿（可夹少量英文），需要时一键把转写交给 DSH 大模型整理成会议纪要，并在左侧工作区生成一条可继续聊天的会话记录。

当前版本：**v0.1.2**（详见 [CHANGELOG.md](CHANGELOG.md)）。

## 功能

- 侧栏入口「会议记录」，主页面完成录音、转写、文稿查看与纪要生成；左侧窄栏是录音与会议列表，右侧是文稿/纪要阅读区，设置项收进右上角齿轮打开的独立弹窗。
- 录音默认同时采集**系统音频**（ScreenCaptureKit）与**麦克风**（AVAudioEngine），逐样本相加混音，输出 16kHz 单声道 PCM。
- 两种转写模式：
  - **录音结束后转写**（默认）：停止后后台整段转写，录音期间同时预热本地模型；
  - **实时转写**：录音中按静音点自动切段识别，边说边出字。
- 识别复用 DSH 内置的 **SenseVoiceSmall (INT8)** provider（`ctx.speechToText`），完全本机离线，不联网、不额外下载模型（DSH 语音输入插件已缓存的模型直接用）。
- 语言默认 `zh`，中文为主；SenseVoice 自带中英混说能力，英文术语、产品名会原样保留。
- 音频与文稿默认存 `~/dsh-meetings/`，可在界面里换目录；每个会议一个目录，结构见下。
- 文稿按「时间戳 + 文本」逐段保存，音频可在页面内直接播放（支持 Range）。
- 「生成会议纪要」不是默认行为：点按钮才把会议目录注册成 DSH 工作区、建一条会话并发送纪要 prompt；模型读 `transcript.md`、写 `minutes.md`，客户端跳到该会话，后续可在同一会话里继续追问与修改。
- 平台：录制的**采集后端目前只实现 macOS**。Host 侧有平台判断，Linux / Windows 上会明确提示「暂不支持」，其余能力（存储、转写、纪要）与平台无关。

## 依赖

- DSH（Web profile），Host 需要 `webServer` 服务；纪要功能需要 `workspaceRegistry` 与 `sessionController` 服务（Desktop 版默认都有）。
- 本地识别需要 DSH 的语音输入插件（`@deepseek-ai/dsh-experimental-speech-to-text` + `-sensevoice`）已启用，且 SenseVoice 模型已准备过（`prepare`）。插件检测不到 provider 时会提示，不会静默失败。
- 录制需要 macOS 13+（ScreenCaptureKit 音频采集），首次使用由插件调用 `swiftc` 编译 `recorder/`（Xcode Command Line Tools，约 10–30 秒）。
- 系统权限：**屏幕录制**（采系统声音）与**麦克风**，授予对象是 DeepSeek Harness。未授权时页面会给出中文提示与跳转说明。
- 无第三方 npm 依赖、无构建步骤、无数据库；客户端只用 React（由 DSH 模块表提供）与浏览器 `fetch` / `ReadableStream`。

## 安装

```bash
git clone https://github.com/iceleaf916/dsh-meeting-notes.git
```

在 DSH 里安装本地 bundle（Plugin Manager 选择仓库目录，或让 Agent 执行 `plugin_manager install_bundle`，目标是该目录绝对路径），刷新页面后从左侧「会议记录」进入。

首次录音会自动编译辅助程序；首次识别若模型未就绪，页面顶部会显示「准备本地模型」按钮。

## 存储结构

默认 `~/dsh-meetings/<会议编号>/`，会议编号形如 `20261110-140322-a1b2`（本地时间 + 4 位随机十六进制）：

| 文件 | 内容 |
|---|---|
| `meeting.json` | 会议元信息与分段转写结果（标题、时间、时长、模式、语言、状态、segments） |
| `audio.wav` | 16kHz 单声道 s16le 录音 |
| `transcript.md` | 带时间戳的转写文稿（`[00:01:23] 文本`） |
| `minutes.md` | 模型生成的会议纪要（只有点过「生成会议纪要」才有） |

同一个存储目录在 DSH 里对应唯一一个「会议记录」工作区，重复点「生成纪要」不会产生重复工作区，每次都会新建一条会话记录。

## 实现说明

### 录音（`recorder/` + `capture.js`）

- `recorder/main.swift` 是独立 CLI：`--sample-rate 16000 --system 1 --mic 1`。
- 系统音频走 ScreenCaptureKit（`SCStreamConfiguration.capturesAudio`，同时挂 `.audio` 与 `.screen` 输出），麦克风走 `AVAudioEngine` 的 inputNode tap；两路都降混单声道后相加 clamp 到 `[-1,1]`，重采样到 16kHz，s16le 裸 PCM 写 stdout。
- stderr 每行一个 JSON 事件（`ready` / `level` / `error` / `stopped`），Host 据此驱动 UI 电平、错误提示与正常退出；stdin 收到 `{"cmd":"stop"}` 或 SIGINT/SIGTERM 即 flush 后退出。
- 首次使用或源码更新后由 `capture.js` 调 `build.sh` 编译到 `recorder/.build/`（已 gitignore），并发调用合并为一次构建。
- 之所以不用 CoreAudio process tap：本机实测 `AudioHardwareCreateProcessTap` + aggregate device 创建与启动都返回成功，但 IOProc 回调永远是 0 帧；ScreenCaptureKit 稳定可用，因此采集后端按「平台接口 + darwin 实现」组织，后续加 Windows（WASAPI loopback）/ Linux（PulseAudio monitor）只需替换这一层。

### 转写（`asr.js`）

- `ctx.speechToText.listProviders()` 找本地 provider（配置的 id 优先，其次名字含 sensevoice，再次第一个 `host-local`），`snapshot()` 读准备状态，未就绪时 `prepare()` 并在后台轮询到 `ready`。
- 输入必须是 WAV（16k mono s16le），provider 单次上限 4MB（约 128 秒），因此录音结束后按**最小能量点**切块（默认 25 秒左右，3–50 秒区间），逐块 `resolve` + `transcribe`，拼回带时间偏移的 segments。
- 实时模式用 `RealtimeSegmenter` 维护 20ms 帧缓冲：攒够 `chunkSeconds` 或尾部 0.6 秒明显安静就切一段转写；另每 3.5 秒用缓冲区做一次「预览识别」实现边说边出字（预览不消费缓冲，正式分段会再转一次）。
- 识别结果为空的分段直接丢弃，避免文稿里出现大量空行。

### 纪要（`minutes.js`）

点击「生成会议纪要」时 Host 侧执行：

1. `workspaceRegistry.create(storageDir, '会议记录')`：把会议存储目录注册成 DSH 工作区（同路径幂等）；
2. `sessionController.create({ workspaceId })`：建一条会话记录（DSH 不接受 `workspaceId` 与 `cwd` 同时给出，会话工作目录即工作区目录）；
3. `sessionController.rename`：标题改为 `纪要 · <会议标题>`；
4. `sessionController.prompt`：排队一条纪要 prompt，要求模型读 `<会议编号>/transcript.md`、写 `<会议编号>/minutes.md`，并在回复里给出纪要全文。

客户端拿到 `sessionId` 后用 `uiWorkspace.openSession(sessionId)` 跳转，用户可以直接在该会话里继续追问；纪要文件的写入由模型完成，Host 不覆盖。

## HTTP 接口

所有接口在 `/dsh-meeting-notes` 下；非 GET 请求必须带 `x-dsh-meeting-notes: 1`，且 Origin 必须是本机 DSH 页面。

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/state` | 平台、配置、存储、provider 准备状态、录音状态、会议列表 |
| POST | `/config` | 保存配置（storageDir / transcribeMode / language / providerId / captureSystemAudio / captureMicrophone / chunkSeconds） |
| POST | `/prepare` | 触发本地模型准备 |
| POST | `/recordings` | 开始录音（body：`{ title?, mode? }`） |
| POST | `/recordings/stop` | 停止并落盘（`after` 模式转写在后台继续） |
| POST | `/recordings/cancel` | 放弃录音并删除本次目录 |
| GET | `/recordings/events` | SSE：`state` / `level` / `partial` / `segment` / `error` |
| GET | `/meetings/<id>` | 会议详情 + `transcript.md` + `minutes.md` |
| GET | `/meetings/<id>/audio` | WAV 音频，支持 Range |
| POST | `/meetings/<id>/transcribe` | 重新转写 |
| POST | `/meetings/<id>/minutes` | 生成纪要工作区记录 |
| DELETE | `/meetings/<id>` | 删除会议目录 |

## 已知限制

- 采集后端仅 macOS；Windows / Linux 需要补对应平台实现。
- 依赖 DSH 语音输入插件的 SenseVoice provider，本插件不打包模型与运行时。
- SenseVoice 对专业术语、远场小音量识别率有限；实时预览会比正式分段粗糙。
- 生成纪要的时间取决于模型响应，页面只负责跳转到会话，不等待模型写完 `minutes.md`。

## 开发

- `recorder/test.sh`：录音辅助程序自测（参数校验 / 混音采样 / EOF / SIGINT）。
- `test/smoke.mjs`：客户端 UI 冒烟（真实 React + jsdom，stub fetch，覆盖首屏、开始录音、生成纪要跳转、设置弹窗与标签切换）。用法：`cd test && npm i react@19 react-dom@19 jsdom && node smoke.mjs`；`node_modules` 已 gitignore。
- `test/preview.mjs`：视觉预览（同一套 jsdom + 真实 React，把主界面几个状态渲染成静态 HTML 到 `/tmp/mn-preview`，再用无头 Chrome 截图；需带 `--virtual-time-budget` 等动画结束）。

## 许可

[MIT](LICENSE)；无第三方运行时代码，音频格式与 ONNX 运行时均由 DSH 侧提供。
