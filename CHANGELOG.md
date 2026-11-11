# Changelog

## v0.2.0

界面按 DSH 设计系统重做，交互改回常规形态。

- 视觉：整体换成 DSH 的规格——14/22 基准字阶、12/18 辅助信息、16/24 弹窗标题、36/28 控件高度、`--dsw-radius-*` 圆角与 `--dsw-shadow-*` 阴影；颜色只引用运行时的 `--dsw-alias-*` 令牌（主色随 DSH 黑/白单色主题走，不再用自造蓝色）；卡片改用 hairline 边框（`.5px border-l3`）而不是灰底，选中项用 `interactive-bg-active`；输入框 34px/border-l4/layer-3 底，开关 36×20 圆点滑块，均与 DSH 组件一致。
- 交互：临时结果提示改为 DSH Toast（顶部居中，3s 停留后淡出）；图标提示改用 DSH Tooltip（hover 500ms 延迟、focus 立即、Escape 关闭、贴边夹取），不再用原生 `title`；删除会议与放弃录音改为 DSH 风格 modal 确认框（mask + 焦点陷阱 + Escape + 取消/确认二选一），不再用按钮文案二次变形；设置页复用同一个弹窗组件，开关补 `role="switch"` / `aria-checked`。
- 组件：插件内自行实现 Tooltip / Modal / ConfirmDialog / Toast（按 practices 规定不 require Harness Client 包，复制的是 DSH 原语的 markup、CSS 与交互行为）。
- 测试：`test/preview.mjs` 的主题令牌换成 DSH 真实取值（含暗色），新增 confirm 与 toast 两组截图场景，并禁用动画保证截图为终态。

## v0.1.4

接入 Qwen3-ASR：插件自带第二个本地 ASR 模型，可在设置页模型列表里与 SenseVoice 切换。

- 新增 `qwen3.js` / `qwen3-worker.js`：把 Qwen3-ASR-0.6B (INT8) 注册为 DSH `speechToText` 的 provider（id `qwen3-asr-0.6b`），模型推理跑在 `worker_threads` 里，主进程不被推理阻塞；空闲 5 分钟释放 worker 回到 standby。
- 模型下载：6 个文件从 ModelScope（国内推荐）或 HF-Mirror 顺序下载，支持断点续用（同尺寸文件跳过）、`.part` 原子落盘、失败换源；进度/步骤/失败原因沿用现有模型列表 UI，无需前端特殊分支。
- Qwen3-ASR 单次推理窗口约 30 秒，超出会输出乱码：provider 通过 `maxChunkSeconds=30` 约束整段转写切块与实时分段长度；UI 标注「实时转写延迟较高，建议结束后转写」。
- `package.json` 新增依赖 `sherpa-onnx-node@^2.0.1`（含 macOS arm64 原生 ONNX 运行时）；新增可选配置 `qwen3ModelDir` / `qwen3Threads`（默认 `~/.dsh/speech-to-text/qwen3-asr-0.6b`、自动线程数）。
- 新增 `test/qwen3.mjs`（WAV 解析、30 秒切块上限、下载错误归类、provider 元数据与未准备状态）；预览脚本补 Qwen3 模型行。

## v0.1.3

识别模型的下载与切换收进设置页，为后续接入更多 ASR 模型预留列表。

- 设置页新增**识别模型**分组：按 DSH 语音服务的 provider 动态渲染列表，每行显示名称、当前使用状态、准备阶段与步骤、下载字节进度、失败原因与建议；未准备时给出磁盘/内存/首次准备耗时估算。
- 下载、重试与取消准备都在模型行内完成，可选择下载源（自动 / Hugging Face / HF-Mirror）；**点按钮才下载**，打开设置页不会自动拉起模型下载。
- 支持在列表里切换当前使用的识别模型（走 `/config` 的 `providerId`）；顶部模型状态 chip 改为设置页入口，录音面板在实时转写未就绪时给出「去设置准备」引导。
- Host 接口扩展：`/state` 返回 `models`（多模型列表与准备进度）与 `speechAvailable`；`POST /prepare` 接受 `{ providerId, downloadSource }`；新增 `POST /prepare/cancel`；`/config` 校验 `providerId` 是否存在。
- 模型进行中时客户端把轮询间隔收紧到 1 秒，其余时间仍是 5 秒，下载进度更连续。
- 新增 `test/models.mjs` 覆盖模型列表、切换、下载与取消准备；`test/smoke.mjs` 同步补充设置页模型列表断言。

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
