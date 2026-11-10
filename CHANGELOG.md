# Changelog

## v0.1.2

- 插件目录与包标识改名为 `dsh-meeting-notes` / `@local/dsh-meeting-notes`，与仓库里带 `dsh-` 前缀的命名习惯一致；HTTP 路由、SSE 事件与 header 同步改为 `/dsh-meeting-notes/*`、`x-dsh-meeting-notes`。
- 侧栏入口 id 与主页面 slot key 相应改为 `dsh-meeting-notes`；中文名仍是「会议记录」，存储目录默认值仍是 `~/dsh-meetings`（不受本次改名影响，既有会议数据无需迁移）。

## v0.1.1

界面重设计（布局、排版与交互），功能与接口不变。

- 设置从页面内联面板改为**独立弹窗**：存储目录、识别语言、分块秒数、采集来源集中在一处，带草稿状态与「有未保存的修改」提示，Esc / 点遮罩 / 取消均可关闭且回滚；改录音模式仍在录音面板上直接切换。
- 主界面改为**两栏布局**：左侧窄栏放录音区与会议列表，右侧是扁平的文稿阅读区；去掉层层包裹的卡片边框，改用间距、分隔线与单一强调色建立层级。
- 详情区新增**文稿 / 纪要切换标签**，纪要 markdown 支持表格、列表、引用、任务清单与行内加粗/代码；文档首行标题与详情标题重复时自动省略。
- 录音状态更醒目：计时器在录音中转为主题红，电平条按麦克风/系统声音两路显示，实时字幕在录音面板内单独成区滚动。
- 状态不再只用彩色药丸表示，改为「圆点 + 文案」，颜色只用于编码含义；主题色全部取自 DSH 主题变量（`--dsw-alias-*`），明暗主题一致。
- 页面刷新或 SSE 断线重连后，会从服务端快照补齐已产出的实时片段。
- 新增 `test/preview.mjs`：用真实 React + jsdom 渲染主界面若干状态为静态 HTML，配合无头 Chrome 截图做视觉自查。

## v0.1.0

首个版本：本地会议录音 + 转写 + 纪要工作区记录。

- 侧栏入口「会议记录」与主页面：录音控制、双电平表、会议列表、文稿与音频查看、配置。
- macOS 录音后端：ScreenCaptureKit 采系统音频 + AVAudioEngine 采麦克风，混音为 16kHz 单声道 s16le；Swift CLI 首次使用时自动编译，平台层可替换（Windows / Linux 待补）。
- 复用 DSH 内置 SenseVoiceSmall (INT8) 本地 provider 转写，支持「录音结束后转写」与「实时转写」两种模式；按静音点切块，规避 provider 单次 4MB 限制。
- 音频与文稿默认存 `~/dsh-meetings/<会议编号>/`（`meeting.json`、`audio.wav`、`transcript.md`、`minutes.md`），存储目录可配置。
- 「生成会议纪要」按钮：把会议目录注册为 DSH 工作区、新建会话、发送纪要 prompt，客户端跳转到该会话后可继续聊天。
- Host HTTP 接口与 SSE 事件流：`/dsh-meeting-notes/state|config|prepare|recordings|meetings/*`。
