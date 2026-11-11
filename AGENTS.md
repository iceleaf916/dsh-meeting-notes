# AGENTS.md

本仓库的工程约束。与通用惯例冲突时以此为准；全局 `~/.dsh/AGENTS.md` 仍然适用。

## 1. 设计风格：必须是 DSH 的设计系统，不是「像 DSH」

唯一真相来源是 DSH 安装包，不是记忆、截图或别处抄来的近似值：

- 安装包：`/Applications/DeepSeek Harness.app/Contents/Resources/app.asar`（bash 不能 `cd` 进去，先解包再读）。
- 样式与规格：`dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/assets/index-*.css` 与同名 `index-*.js`（组件原语源码在里面）。
- 令牌真值：`dsh/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js`（`--dsw-*` 全部由它在运行时注入到 `body`，静态 CSS 里查不到定义）。
- 插件规范：安装包里 `cordis-plugin-development` skill 的 `practices.md`（明确要求不得 require Harness Client 包，只能复制原语）。

硬性要求：

- **颜色只引用令牌**：`var(--dsw-alias-*, fallback)` / `var(--dsw-static-*, fallback)`，不写死十六进制色；fallback 用 DSH 浅色主题真值。主色是 `--dsw-alias-brand-primary`：浅色近黑、深色近白，**不是蓝色**。
- **尺寸只用规格值**：字阶 14/22 基准、12/18 辅助、11/17 标签、16/24 弹窗标题、20/28 详情标题；控件高 36（md）/28（sm）/24（段控）；圆角 `--dsw-radius-sm|md|lg|panel`；阴影 `--dsw-shadow-lv1|lv3|--dsw-elevation-prominent`。
- **层级靠 hairline 边框**（`.5px solid var(--dsw-alias-border-l3)`），不要靠灰底：DSH 浅色下 `bg-layer-1/2/3` 同为白色。选中/悬停用 `interactive-bg-active` / `interactive-bg-hover`，不要拿 layer-2 假装「灰色选中」。
- **组件形态照抄 DSH 原语**：按钮 primary / outline / ghost / toolbar（disabled `opacity:.4`）、输入框 34px + `border-l4` + `layer-3` 底、开关 36×20 圆点滑块、分段控件 `module-platform` 底 + `layer-3` 指示块、Dialog 结构（mask → 圆角 panel → header/title/close/body/footer）。
- 插件自身实现原语，class 一律 `mn-` 前缀；不 portal 到 `document.body`，用页内 `position:fixed`。

## 2. 交互：常规形态，不自创

| 场景 | 用什么 |
| --- | --- |
| 图标 / 模式说明 | Tooltip（hover 延迟 500ms、focus 立即、Escape 关闭、贴边夹取） |
| 一次性操作结果（已复制、已删除） | Toast（顶部居中、3s 停留后淡出） |
| 不可撤销操作（删除会议、放弃录音） | ConfirmDialog（mask + 焦点陷阱 + Escape + 取消/确认二选一） |
| 常驻错误 / 警告 | inline Banner |

禁止的反常规交互：

- 按钮文案随状态变形（「确认删除？」再点一次）——用 modal 确认。
- 「N 秒内再点一次同一按钮」的隐式二次确认。
- 用常驻 Banner / 内联提示条显示一次性的操作结果。
- 在标准确认流程上叠加多余勾选门槛。
- 原生 `title=` 属性（系统黄条、样式不受控）——用 Tooltip。

模态必须满足：`role="dialog"` + `aria-modal` + `aria-label`、初始焦点落在内容上、Tab/Shift+Tab 首尾循环、关闭后焦点回填、busy 时不可关闭。

不可随意修改的 public 钩子：`aria-label` 的「设置 / 刷新 / 关闭 / 删除」、`role="tab"`、`role="dialog"`——`test/preview.mjs` 与 `test/smoke.mjs` 依赖它们。

## 3. 实现约束

- 不 require 任何 `@deepseek-ai/dsh-client-*`（含 primitives），复制实现。
- 文案走 `ctx.locale`，zh / en 必须同步（新增键两边都要有）。
- 不往页外写 DOM，不复用别人的 CSS 变量名，不引第三方 UI 库。
- 交互状态收敛在 store（如 `confirm: '' | 'delete' | 'cancel'`），不要散落在组件内部的临时 state 里。

## 4. 验证（改 UI 必跑）

```bash
node --check client.js
node test/smoke.mjs          # jsdom 结构/交互断言，应全 ok 且退出码 0
cd test && node preview.mjs /tmp/mn-preview
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
  --window-size=1280,1000 --screenshot=/tmp/mn-preview/x.png "file:///tmp/mn-preview/x.html"
```

- 截图必须禁动画（preview 页已注入 `animation:none`，再配 `--force-prefers-reduced-motion`），否则会抓到过渡中间帧，看到「半透明弹窗」之类的假象。
- `test/preview.mjs` 的 `THEMES` 是 DSH 真实令牌值：改主题或组件规格时同步更新，不要留近似值。
- jsdom 的 `activeElement$1.attachEvent is not a function`、`not configured to support act(...)` 是既有噪声，不影响结论。
- 不做会抢占前台窗口的 GUI 自动点击来「验证 UI」；以真实令牌渲染的截图 + 结构断言为准，真机由人刷新页面看。

## 5. 版本号 x.y.z

- **x**：只有用户明确要求时才升。
- **y**：新增功能，或功能性调整（交互流程、UI 结构、接口行为变化）。
- **z**：仅 bug 修复。

升版本必须四处同步：`package.json`、`package-lock.json`（version 与 `packages[""].version`）、`README.md` 的「当前版本」、`CHANGELOG.md` 顶部条目（标题与 package.json 一致）。
