# Changelog

## v0.7.2

设置弹窗按用途分栏，识别模型与顶栏模型入口改为下拉选择。

- 设置弹窗新增顶部 tab：语音转录（识别模型、识别）、会议录音（存储、采集）、通用（会议提醒），默认语音转录；沿用详情区的下划线 tab 样式，支持左右方向键 / Home / End 切换，跨分栏保留「有未保存的修改」提示，tabs 常驻不随内容滚动。
- 「识别模型」由竖排模型卡片改为一个下拉框 + 所选模型的详情卡：下拉只切换当前查看/配置的模型，实际切换仍需点详情卡里的「使用该模型」，避免浏览其他模型时误切。
- 顶栏模型胶囊改为内嵌原生下拉，选中即切换生效；齿轮仍打开设置页，下载与密钥配置在详情卡里完成。
- ASR 模型状态按来源梳理并统一到设置页与顶栏：`已就绪`（本地模型已下载 / 云端密钥已配置）、`未下载`（本地模型未准备）、`未配置密钥`（云端模型缺 API 密钥），其余阶段沿用下载中 / 校验中 / 加载中 / 唤醒中 / 失败等文案。
- 中英文案同步；`test/smoke.mjs` 覆盖分栏结构、键盘切换、未保存提示与保存流程，`test/models.mjs` 覆盖下拉选项状态、详情卡切换、下载进度、取消准备与切换/保存载荷。
- 文档：README 更新识别模型下拉与详情卡、顶栏模型切换、状态说明。

## v0.7.1

把硅基流动 API 密钥输入框移到云端模型行内。

- 设置页不再把密钥放在「识别」分组底部：云端模型行在「未配置硅基流动 API 密钥」提示下方直接给出密钥输入框（密码形态 + 环境变量回退说明），看到提示即可就地填写，不必再往下找配置项。
- 未配置密钥的说明文案改为「请在模型下方的输入框中填写后使用云端识别」；输入框的 `id` 按模型生成（`mn-model-key-<providerId>`），避免以后出现多个云端模型时 ID 冲突。
- 测试：`test/models.mjs` 改为在模型行内查找密钥输入框并继续校验密码形态、环境变量说明与保存载荷；`test/preview.mjs` 增加云端模型行用于视觉预览。

## v0.7.0

新增硅基流动云端识别模型 XingChenASR-V3.2-Ultra，本地 / 云端可切换。

- 新增 `xingchen.js`：硅基流动（SiliconFlow）云端 provider，id `xingchen-asr`、`location: 'cloud'`，把切好的 WAV 以 multipart（`file` + `model`）POST 到 `https://api.siliconflow.cn/v1/audio/transcriptions`，不需要下载或加载本地模型。密钥优先取插件配置 `siliconflowApiKey`，为空回退 `SILICONFLOW_API_KEY` 环境变量；没有密钥时模型行显示「未配置硅基流动 API 密钥」并保持 `unprepare`。
- 错误按状态码归类（密钥无效 / 余额不足 / 接口或模型不存在 / 频繁 / 服务不可用 / 网络 / 超时），可重试的错误自动重试一次（800ms），取消信号不重试；`maxChunkSeconds: 50` 与 `asr.js` 的硬上限一致，`realtime: false`。
- 语言集合 `auto/zh/en/yue`：接口未公开 `language` 参数，由模型自动判断中英与方言；切到云端模型时客户端会把 `ja` / `ko` 自动改为 `auto`，Host 侧也会校验并拒绝不支持的语言。
- 设置页「识别」分组新增硅基流动 API 密钥输入框（密码形态、说明音频会上传到硅基流动、留空回退环境变量），保存随 `/config` 提交；模型行新增「硅基流动云端」来源标注、未配置密钥提示与「不建议开启实时转写」说明（实时分段延迟高且会重复上传），录音页的实时模式提示同步更新；中英文文案同步。
- `storage.js` 新增 `siliconflowApiKey` 配置项（默认空，超过 300 字符拒绝）；`index.js` 把云端 provider 与两个本地 provider 一起注册进 `asr-registry`，启动 / 停止录音的报错文案去掉「本地」限定。
- 测试：新增 `test/xingchen.mjs`（13 项：元数据、无密钥状态、multipart 字段、时长回退、错误归类、401 不重试、5xx 重试、取消不重试）；`test/models.mjs` 增加云端模型行 / 密钥输入框 / 保存载荷断言。真机实测 37.1 秒中文音频切成 2 段转写约 7.6 秒（约 0.24× 实时），转写文本连贯。
- 文档与打包：README 补充云端模型、密钥配置、依赖与已知限制；`files` 增加 `xingchen.js`。

## v0.6.0

适配 Linux：录音与会议检测在 Linux 上可用（Windows 仍不支持）。

- 新增 `capture-linux.js`：读取 `pactl` 的默认 sink / 默认输入源，为 sink 的 `.monitor` 源与默认麦克风各起一路 `parec`（16kHz 单声道 s16le、20ms 延迟）；`PcmMixer` 按「首块到达时间 − 块时长」估算每路起点，晚开始的流补静音，每 20ms 按绝对时间轴逐样本相加并 clamp 到 int16，每 100ms 上报合并电平。启动前用 `pactl list short sources` 校验设备名（PipeWire 的 pulse 兼容层遇到不存在的源会永久阻塞），支持 `DSH_MEETING_SYSTEM_SOURCE` / `DSH_MEETING_MIC_SOURCE` 覆盖。
- 新增 `detect-linux.js`：用 `ps -eo pid=,comm=` 精确匹配腾讯会议（`wemeetapp` / `wemeet`）与企业微信会议（`wwmapp` / `wxwork` 等）进程，再读 `pactl -f json list sink-inputs|source-outputs`（不可用时回退文本解析）判断该进程是否在放音 / 收音，名字或描述含 `wemeet` 的专用 sink 也算在会中；进程名精确匹配避免把企业微信目录里的 `wemeet.dll` 误判成腾讯会议。不依赖 X11 窗口标题，Wayland 下可用。
- `capture.js` / `detector.js` 增加 Linux 分派，`detect.js` 的 `available` 与错误文案按平台区分；`/state.capabilities.buildRecorder` 在 Linux 为 `false`（不需要编译）；录音失败提示改为 Linux 的设备检查说明；客户端「会议检测仅支持 macOS」提示改为「macOS 14.2+ 或 Linux（pactl）」，中英文同步。
- 测试：新增 `test/linux.test.mjs`（8 项：混音对齐与截断、单路电平、`pactl` 解析、设备解析、检测采样契约与幂等停止），无 `pactl` 时检测用例自动跳过；真机 PipeWire 1.6.4 验证双路录音、静音设备、模拟 `wemeetapp` 进程与音频流均正常。
- 文档与打包：README 补充 Linux 依赖（`pulseaudio-utils` / PipeWire）、采集与检测实现说明、已知限制；`files` 增加 `capture-linux.js` / `detect-linux.js`。

## v0.5.0

识别引擎改由插件自带，不再依赖 DSH 语音输入插件。

- 修复：停用 DSH 语音输入插件后设置页模型列表为空、录音与转写直接报「语音识别服务未启用」的问题。模型列表与推理不再以 `ctx.speechToText` 为唯一来源，DSH 里的可选语音插件只作为额外来源。
- 新增 `asr-registry.js` 门面：把插件自带的 SenseVoiceSmall 与 Qwen3-ASR 两个 provider 合并成与 DSH 语音服务同形状的接口（列表 / 快照 / 准备 / 取消 / 解析 / 转写），每行标注来源「插件自带」或「DSH 语音插件」；DSH 服务存在时把同一个 Qwen3 实例注册进去共享，不存在时全部走自带实现。
- 新增自带 SenseVoice provider（`sensevoice.js` + `asr-worker.js`）：默认复用 DSH 语音插件已下载的模型目录 `~/.dsh/speech-to-text/sensevoice/models/sensevoice-onnx`（可用 `sensevoiceModelDir` 覆盖）避免重复下载；模型文件锁定上游 commit 与 sha256；language 固定 `auto` 并开启 ITN，支持实时转写。
- 抽出 `model-runtime.js`（多源下载、sha256 校验、准备状态机、worker 空闲释放、失败占位）与 `wav.js`，Qwen3-ASR 改用同一运行时；原 `qwen3-worker.js` 更名为 `asr-worker.js` 供两个引擎共用。
- 初始化失败不再静默：某个引擎启动失败时仍以 `phase: 'failed'` 的模型行显示原因，另一引擎照常可用；`/state.models` 恒非空，`speechAvailable` 保留「DSH 语音服务是否存在」的语义。
- 客户端：模型行新增来源标签；空列表文案改为提示插件自带引擎初始化失败，不再要求开启 DSH 语音插件；中文 / 英文文案同步。
- 测试：新增 `test/registry.mjs`（12 项门面路由与合并回退）与 `test/sensevoice.mjs`（5 项元数据与资源锁）；`test/models.mjs`、`test/preview.mjs` 增加来源标签断言；真机用真实模型目录验证两个引擎均能 prepare + transcribe（20 秒音频 SenseVoice 约 0.46 秒、Qwen3-ASR 约 2.66 秒）。

## v0.4.0

会议提醒支持企业微信内置会议。

- 检测目标新增企业微信的会议子进程 `com.tencent.wwmapp`（进程显示名「企业微信·会议」）：企业微信内置会议不在主进程 `com.tencent.WeWorkMac` 里跑音频，只匹配主进程既抓不到会议，也容易把语音消息/语音通话误判成会议。
- `detect.js` 增加客户端映射（bundle / 可执行路径 → 「腾讯会议」/「企业微信会议」），建议卡片与系统通知文案会写清是哪个客户端；检测进程仍只上报音频占用状态。
- 测试：`test/detect.test.mjs` 增加企业微信会议识别用例（共 11 项）；真机实测 `wwmapp` 在会中 `input/output` 均为 true，空闲时为 false。

## v0.3.0

会议提醒：检测腾讯会议开始/结束，建议开始或结束录音。

- 检测：新增 `recorder/detector.swift`（CoreAudio 进程对象 + CGWindowList，macOS 14.2+，无需 TCC 权限）与 `detector.js`（编译/进程管理、JSONL 事件）；只读麦克风/扬声器占用，不读音频内容、不自动录音。腾讯会议没有可用的本地会议事件，音频占用是「在会中」的近似真值。
- 状态机：`detect.js` 音频持续 2s 判开始、消失 12s 判结束；建议 10/5 分钟过期，忽略或过期后 30 分钟冷却；检测进程异常以 5s 间隔最多重启 3 次。同意时直接复用现有开始/结束录音逻辑，手动录音也会清掉过时建议。
- 客户端：rail 新增建议卡片（同意 / 忽略）；`/detect/events` 订阅提升到插件启动作用域，页面最小化或切到其他对话时仍能收到建议并弹系统通知，不再依赖「会议记录」页处于加载状态；以 DeepSeek Harness 身份发送系统通知（点击回到页面），设置页新增「会议提醒」分组（检测开关、系统通知开关、权限与平台不支持提示）以及「发送测试通知」按钮，用于自检当前环境是否真的展示渲染进程通知。
- 接口：新增 `GET /detect`、`POST /detect/ack`、`GET /detect/events`；`/state` 增加 `detect` 快照；`/config` 增加 `detectEnabled`、`detectNotify`、`detectStartSustainSeconds`、`detectEndGraceSeconds`、`detectCooldownMinutes`，`normalizeConfig` 负责校验与夹取。
- 构建/测试：`recorder/build.sh` 支持自定义源文件，module-cache 失效时自动清缓存重试一次；新增 `test/detect.test.mjs`（10 项纯逻辑测试）；`test/preview.mjs` 增加会议建议卡片与设置分组场景。
- 已知限制：检测仅 macOS 14.2+；结束判定依赖音频占用，会议中长时间双方完全静音时可能延迟；系统通知由客户端插件常驻发出，DSH 运行期间（页面可最小化或在其他对话）有效，DSH 完全退出后不提醒；Desktop 渲染进程通知是否进入通知中心取决于环境，可用设置页「发送测试通知」自检，彻底后台方案（helper App / DSH 上游通知）未做；渲染进程通知只能点击回到页面、无法并排双按钮，MVP 采用「系统通知叫醒 + 页内卡片二选一」。

## v0.2.1

发布链路改用 npm 可信发布（OIDC），CI 打 tag 即自动发版，仓库不存密钥。

- `.github/workflows/release.yml` 去掉 `NPM_TOKEN` 分支：发布步骤只跑 `./publish.sh --ci --provenance --skip-tests`，用 `id-token: write` 换 npm 一次性发布凭据并签名 provenance；npm 侧登记了可信发布（`iceleaf916/dsh-meeting-notes` + `release.yml`，`npm trust list` 可核对）。
- `publish.sh` 的 registry 校验改为最多 90 秒轮询，区分「版本还在同步」和「staged 发布待维护者放行」，并把 2FA 失败的提示改成指向可信发布（账号为 `auth-and-writes` 时，未勾选 Bypass 2FA 的 granular token 发布必被 `EOTP` 拦下）。
- 文档：README 的发布段落改成「首次人工、之后 tag 自动」，说明新包先出现 `0.0.0-stage` 占位版本的现象。

## v0.2.0

界面按 DSH 设计系统重做，交互改回常规形态。

- 视觉：整体换成 DSH 的规格——14/22 基准字阶、12/18 辅助信息、16/24 弹窗标题、36/28 控件高度、`--dsw-radius-*` 圆角与 `--dsw-shadow-*` 阴影；颜色只引用运行时的 `--dsw-alias-*` 令牌（主色随 DSH 黑/白单色主题走，不再用自造蓝色）；卡片改用 hairline 边框（`.5px border-l3`）而不是灰底，选中项用 `interactive-bg-active`；输入框 34px/border-l4/layer-3 底，开关 36×20 圆点滑块，均与 DSH 组件一致。
- 交互：临时结果提示改为 DSH Toast（顶部居中，3s 停留后淡出）；图标提示改用 DSH Tooltip（hover 500ms 延迟、focus 立即、Escape 关闭、贴边夹取），不再用原生 `title`；删除会议与放弃录音改为 DSH 风格 modal 确认框（mask + 焦点陷阱 + Escape + 取消/确认二选一），不再用按钮文案二次变形；设置页复用同一个弹窗组件，开关补 `role="switch"` / `aria-checked`。
- 组件：插件内自行实现 Tooltip / Modal / ConfirmDialog / Toast（按 practices 规定不 require Harness Client 包，复制的是 DSH 原语的 markup、CSS 与交互行为）。
- 测试：`test/preview.mjs` 的主题令牌换成 DSH 真实取值（含暗色），新增 confirm 与 toast 两组截图场景，并禁用动画保证截图为终态。
- 打包发布：npm 包名改为 `@iceleaf/dsh-meeting-notes`（`@local/` 只用于本地 link），`cordis.patch.yml` 的 `name` 与 `client.js` 的模块 id 同步；`files` 补上 `qwen3.js` / `qwen3-worker.js`（之前漏了，装包后会在 `import './qwen3.js'` 处直接崩）；`jsdom` / `react` / `react-dom` 从 `dependencies` 移到 `devDependencies`（React 由宿主模块表提供，`jsdom` 只用于测试），`sherpa-onnx-node` 仍是唯一运行时依赖；补 `repository` / `homepage` / `bugs` / `keywords` / `publishConfig`（发布固定走 `registry.npmjs.org`，避开本机 npmmirror 只读镜像），并去掉 `private`。发布链路脚本化：`publish.sh` 把「元数据、包内容、语法与冒烟测试、四处版本号同步、registry 判重、脏工作区确认、dry-run、登录态」收成十步前置检查，交互终端里把 stdio 原样交给 `npm publish`（2FA 需要浏览器授权，接管道会直接 `EOTP`）；新增 `.github/workflows/ci.yml`（打包预检）与 `release.yml`（推 `v*` tag 自动发布并带 provenance，支持 `NPM_TOKEN` 或 OIDC 可信发布）。

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
