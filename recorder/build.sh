#!/usr/bin/env bash
# 构建会议记录插件的 Swift 辅助程序（录音 recorder / 会议检测 detector）。
# 用法：bash build.sh [输出路径] [源文件]
#   默认产物：dsh-meeting-notes/recorder/.build/meeting-recorder
#   默认源码：main.swift（Web/录音辅助程序）
#   检测器：bash build.sh .build/meeting-detector detector.swift
#   相对路径都相对于本脚本所在目录（recorder/）解析。
# 说明：本机 sandbox 下默认 clang module cache 不可写，必须显式指定
# -module-cache-path / -Xcc -fmodules-cache-path 到工程内 .build/module-cache。
set -euo pipefail

cd "$(dirname "$0")"

OUTPUT="${1:-$PWD/.build/meeting-recorder}"
SOURCE="${2:-main.swift}"
MODULE_CACHE="$PWD/.build/module-cache"

# 相对源文件按 recorder/ 解析；绝对路径原样使用。
case "$SOURCE" in
  /*) SOURCE_PATH="$SOURCE" ;;
  *) SOURCE_PATH="$PWD/$SOURCE" ;;
esac

if [ ! -f "$SOURCE_PATH" ]; then
  echo "源文件不存在：$SOURCE_PATH" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT")" "$MODULE_CACHE"

if ! command -v swiftc >/dev/null 2>&1; then
  echo "未找到 swiftc，请先安装 Xcode Command Line Tools（xcode-select --install）" >&2
  exit 1
fi

TARGET_ARCH="$(uname -m)"
TARGET="${TARGET_ARCH}-apple-macosx13.0"

build_once() {
  swiftc \
    -O \
    -swift-version 5 \
    -target "$TARGET" \
    -module-cache-path "$MODULE_CACHE" \
    -Xcc "-fmodules-cache-path=$MODULE_CACHE" \
    -o "$OUTPUT" \
    "$SOURCE_PATH"
}

# module-cache 里存着上次编译时的绝对路径；仓库被移动/重装到新目录后，
# 旧缓存会报 "precompiled file was compiled with module cache path …" 或
# "missing required module 'SwiftShims'"。清一次缓存重试即可自愈。
if ! build_once; then
  echo "编译失败，清理 module-cache 后重试一次…" >&2
  rm -rf "$MODULE_CACHE"
  mkdir -p "$MODULE_CACHE"
  build_once
fi

# 注意：全角括号紧跟在变量后，bash 在本机 locale 下会把其后字节并入变量名，
# 所以这里必须写 ${VAR} 显式界定变量边界。
echo "已构建：${OUTPUT}（源码：${SOURCE_PATH}）" >&2
