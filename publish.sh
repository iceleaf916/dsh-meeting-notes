#!/usr/bin/env bash
# 把本仓库发布到 npm（默认 registry.npmjs.org，可用 NPM_REGISTRY 覆盖）。
#
#   ./publish.sh                # 正式发布：自检 → 测试 → 登录检查 → 发布 → 校验
#   ./publish.sh --dry-run      # 只演练：自检 + 测试 + 打包预检，不写 registry
#   ./publish.sh --yes          # 跳过交互确认（工作区脏也照发）
#   ./publish.sh --skip-tests   # 跳过 test/smoke.mjs
#   ./publish.sh --ci --provenance
#                               # CI 用：不查 npm whoami（走 OIDC / NODE_AUTH_TOKEN），
#                               # 发布时带 --provenance（GitHub Actions 可信发布）
#   NPM_OTP=123456 ./publish.sh # 2FA 验证码走环境变量
#
# 退出码：0 成功；1 前置条件不满足；2 参数错误；3 发布失败。

set -euo pipefail
cd "$(dirname "$0")"

REG="${NPM_REGISTRY:-https://registry.npmjs.org/}"
DRY_RUN=0
ASSUME_YES=0
SKIP_TESTS=0
CI=0
PROVENANCE=0
OTP="${NPM_OTP:-}"

for arg in "$@"; do
  case "$arg" in
    -n|--dry-run) DRY_RUN=1 ;;
    -y|--yes) ASSUME_YES=1 ;;
    --skip-tests) SKIP_TESTS=1 ;;
    --ci) CI=1 ;;
    --provenance) PROVENANCE=1 ;;
    -h|--help)
      awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$0"
      exit 0 ;;
    *) printf '未知参数：%s（用 --help 看用法）\n' "$arg" >&2; exit 2 ;;
  esac
done

# 在 GitHub Actions 里默认就是 CI 语义
if [ "${GITHUB_ACTIONS:-}" = "true" ]; then CI=1; fi

say() { printf '\n\033[1m== %s\033[0m\n' "$*"; }
ok()  { printf '\033[32m✓ %s\033[0m\n' "$*"; }
die() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

# ---- 1. 元数据 -------------------------------------------------------------
PKG=$(node -p "require('./package.json').name")
VER=$(node -p "require('./package.json').version")
say "包：$PKG@$VER  →  $REG"

[ "$(node -p "Boolean(require('./package.json').private)")" = "true" ] \
  && die 'package.json 还带 "private": true，npm 会拒绝发布'
case "$PKG" in
  @local/*) die '包名还在 @local/ scope 下（那是仓库本地占位用法），先改成可发布的 scope' ;;
esac

# ---- 2. 包内容自检（历史上 files 漏过 qwen3.js，装包后顶层 import 会崩）----
say "包内容自检"
PACK_JSON=$(npm pack --dry-run --json 2>/dev/null) \
  || die 'npm pack --dry-run 失败，先单独跑一次看报错'
LIST=$(printf '%s' "$PACK_JSON" | node -e \
  "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{process.stdout.write(JSON.parse(s)[0].files.map(f=>f.path).join('\n'))})")
for f in index.js client.js storage.js capture.js asr.js minutes.js qwen3.js sensevoice.js \
         model-runtime.js wav.js asr-worker.js asr-registry.js \
         cordis.patch.yml package.json README.md LICENSE locale/zh.json locale/en.json; do
  printf '%s\n' "$LIST" | grep -qx "$f" || die "打包缺文件：$f（检查 package.json 的 files 数组）"
done
printf '%s' "$PACK_JSON" | node -e \
  "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s)[0];console.log('   tarball：'+j.entryCount+' 个文件，'+j.size+' 字节（解包 '+j.unpackedSize+'）')})"
ok '必需文件齐全'

# 客户端模块 id、bundle patch 的 name 必须与包名一致，否则改名后配置与模块都解析不到
grep -q "id: '$PKG'" client.js || die "client.js 的 __ModuleLoader__.load({ id: ... }) 不是 '$PKG'"
grep -q "name: '$PKG'" cordis.patch.yml || die "cordis.patch.yml 的 name 不是 '$PKG'"
ok "client.js 模块 id 与 cordis.patch.yml name 都对齐 $PKG"

# ---- 3. 语法与测试 --------------------------------------------------------
say "语法检查"
for f in index.js client.js storage.js capture.js asr.js minutes.js qwen3.js sensevoice.js \
         model-runtime.js wav.js asr-worker.js asr-registry.js; do
  node --check "$f" || die "语法错误：$f"
done
ok 'node --check 全部通过'

if [ "$SKIP_TESTS" -eq 0 ]; then
  say "冒烟测试（test/smoke.mjs）"
  [ -d node_modules ] || die 'node_modules 不存在，先 npm install'
  node test/smoke.mjs > /tmp/publish-smoke.log 2>&1 \
    || { tail -20 /tmp/publish-smoke.log; die 'smoke 测试失败（完整日志 /tmp/publish-smoke.log）'; }
  ok "smoke 通过（$(grep -c '^ok ' /tmp/publish-smoke.log) 条断言 ok）"
fi

# ---- 4. 版本号四处同步（package.json / package-lock / README / CHANGELOG）--
say "版本号同步检查"
LOCKV=$(node -p "const l=require('./package-lock.json');[l.version,l.packages[''].version].join('/')")
[ "$LOCKV" = "$VER/$VER" ] \
  || die "package-lock.json 里版本是 $LOCKV，与 $VER 不一致（跑 npm install --package-lock-only）"
grep -q "当前版本：\*\*v$VER\*\*" README.md || die "README 的「当前版本」不是 v$VER"
grep -q "^## v$VER" CHANGELOG.md || die "CHANGELOG.md 顶部没有 «## v$VER» 条目"
ok "package-lock / README / CHANGELOG 都是 v$VER"

# ---- 5. 版本是否已被占用 --------------------------------------------------
say "版本占用检查"
VERSION_TAKEN=0
if EXIST=$(npm view "$PKG@$VER" version --registry="$REG" 2>/dev/null); then
  VERSION_TAKEN=1
  if [ "$DRY_RUN" -eq 1 ]; then
    # dry-run 只做打包预检（CI 每次 push 都会跑），版本已发布反而是常态；
    # 真正发布会再走一次检查，那时才需要升 version。
    printf '\033[33m! registry 上已存在 %s@%s；dry-run 继续，真正发布前请先升 version\033[0m\n' "$PKG" "$EXIST"
  else
    die "registry 上已存在 $PKG@$EXIST；npm 版本不可覆盖，请先升 version（z 位修复 / y 位功能）"
  fi
else
  ok "$VER 尚未发布"
fi

# ---- 6. 工作区是否干净（发布后版本不可撤回，别把未提交代码发出去）--------
if git rev-parse --git-dir >/dev/null 2>&1; then
  DIRTY=$(git status --porcelain)
  if [ -n "$DIRTY" ]; then
    printf '\n\033[33m工作区有未提交改动：\033[0m\n%s\n' "$DIRTY"
    if [ "$DRY_RUN" -eq 0 ] && [ "$ASSUME_YES" -eq 0 ] && [ "$CI" -eq 0 ]; then
      read -r -p '确认发布这份未提交的代码？[y/N] ' ans
      case "$ans" in y|Y) ;; *) die '已取消' ;; esac
    fi
  else
    ok '工作区干净'
  fi
fi

# ---- 7. 演练模式到此为止 --------------------------------------------------
if [ "$DRY_RUN" -eq 1 ]; then
  say "演练发布（--dry-run，不写 registry）"
  if [ "$VERSION_TAKEN" -eq 1 ]; then
    # npm publish --dry-run 仍会做版本占用校验，已发布版本必然失败；
    # 打包预检在第 2 步已经用 npm pack --dry-run 完成，这里只复核包内容。
    npm pack --dry-run >/dev/null || die '打包预检失败'
    ok "版本 $VER 已发布，跳过 npm publish 演练（打包预检已通过）"
  else
    npm publish --dry-run --registry="$REG" --access public
  fi
  ok '演练通过'
  exit 0
fi

# ---- 8. 登录态（CI 模式交给 npm：OIDC 可信发布或 NODE_AUTH_TOKEN）--------
say "登录检查"
if [ "$CI" -eq 1 ]; then
  ok 'CI 模式：跳过 npm whoami（用 OIDC 可信发布或 NODE_AUTH_TOKEN）'
else
WHO=$(npm whoami --registry="$REG" 2>/dev/null || true)
if [ -z "$WHO" ] && [ -t 0 ] && [ "$ASSUME_YES" -eq 0 ]; then
  printf '\n未登录 %s，现在执行 npm login？（--registry 必须带，否则会登录到 ~/.npmrc 里的镜像）\n' "$REG"
  read -r -p '现在登录？[Y/n] ' ans
  case "$ans" in
    n|N) die "已取消：先在终端执行 npm login --registry=$REG 再重跑" ;;
  esac
  npm login --registry="$REG" || die 'npm login 未完成'
  WHO=$(npm whoami --registry="$REG" 2>/dev/null || true)
fi
[ -n "$WHO" ] || die "未登录 $REG，先执行：npm login --registry=$REG"
ok "已登录：$WHO"
fi

# ---- 9. 发布（2FA：交互终端交给 npm 自己处理，非交互用 NPM_OTP）-----------
say "发布 $PKG@$VER"
LOG=$(mktemp -t dsh-publish.XXXXXX.log)
trap 'rm -f "$LOG"' EXIT

PUBLISH_ARGS=(--registry="$REG" --access public)
if [ "$PROVENANCE" -eq 1 ]; then PUBLISH_ARGS+=(--provenance); fi
if [ -n "$OTP" ]; then PUBLISH_ARGS+=(--otp="$OTP"); fi

rc=0
if [ -t 0 ] && [ -t 1 ] && [ "$CI" -eq 0 ]; then
  # 交互终端：stdio 全交给 npm。2FA 的「打开浏览器认证」和「输入验证码」
  # 都要求真实 TTY，一旦把 stdout 接到管道，npm 会直接 EOTP 退出。
  set +e
  npm publish "${PUBLISH_ARGS[@]}"
  rc=$?
  set -e
else
  set +e
  npm publish "${PUBLISH_ARGS[@]}" 2>&1 | tee "$LOG"
  rc=${PIPESTATUS[0]}
  set -e
fi

if [ "$rc" -ne 0 ]; then
  printf '\033[31m✗ 发布失败（exit %s）\033[0m\n' "$rc"
  if [ -s "$LOG" ]; then
    printf -- '--- 错误摘要 ---\n'
    if grep -qE 'npm error' "$LOG"; then grep -E 'npm error' "$LOG" | tail -20; else tail -20 "$LOG"; fi
  fi
  cat <<EOF
  排查方向：
    - 未登录：npm login --registry=$REG
    - 需要 2FA：非交互场景改用 npm 可信发布（OIDC，workflow 需要 id-token: write），
      或在真实终端里跑 ./publish.sh 走浏览器授权；账号为 auth-and-writes 时，
      未勾选「Bypass 2FA」的 granular token 发布必被 EOTP 拦下
    - 权限：确认你的 npm 账号对 $PKG 有 publish 权限
EOF
  exit 3
fi

# ---- 10. 校验与后续步骤 ----------------------------------------------------
# 校验是「尽力而为」：npm publish 的退出码是发布是否成功的唯一判据。
# registry 读回可能受 CDN / 镜像缓存影响而延迟（v0.3.0 就出现过晚 30 秒），
# 因此这里只用于提示，查不到不再让发布流程失败。
say "校验 registry（尽力而为，不影响发布结果；传播/CDN 可能延迟，最多等 60 秒）"
VERIFY_RC=1
for ((_i = 0; _i < 12; _i++)); do
  if npm view "$PKG@$VER" version --registry="$REG" >/dev/null 2>&1; then VERIFY_RC=0; break; fi
  sleep 5
done
if [ "$VERIFY_RC" -eq 0 ]; then
  ok "registry 已可见：$PKG@$VER"
  npm view "$PKG@$VER" version dist.tarball --registry="$REG" 2>/dev/null || true
else
  printf '\033[33m! npm publish 已返回成功，但 60 秒内 registry 还没查到 %s\033[0m\n' "$VER"
  printf '  registry 传播 / CDN / 镜像缓存都可能延迟，以 npm publish 退出码为准，不再因此判定失败。\n'
  printf '  稍后自查：https://www.npmjs.com/package/%s/v/%s\n' "$PKG" "$VER"
fi

printf '\n\033[32m✓ 发布完成\033[0m\n    https://www.npmjs.com/package/%s/v/%s\n' "$PKG" "$VER"
cat <<EOF

安装 / 升级：
    dsh plugin --profile <profile 名> add $PKG@$VER

把本地 profile 从 link: 切到正式包（可选）：
    ~/.dsh/profiles/<profile 名>/package.json 里把
      "$PKG": "link:..."   →   "$PKG": "^$VER"
    再删掉 node_modules 下的该包符号链接并重装。

打 tag（可选）：
    git tag -a v$VER -m "v$VER" && git push origin v$VER
EOF
