#!/usr/bin/env bash
# 构建会议记录录音辅助程序。
# 用法：bash build.sh [输出路径]
#   默认产物：dsh-meeting-notes/recorder/.build/meeting-recorder
# 说明：本机 sandbox 下默认 clang module cache 不可写，必须显式指定
# -module-cache-path / -Xcc -fmodules-cache-path 到工程内 .build/module-cache。
set -euo pipefail

cd "$(dirname "$0")"

OUTPUT="${1:-$PWD/.build/meeting-recorder}"
MODULE_CACHE="$PWD/.build/module-cache"

mkdir -p "$(dirname "$OUTPUT")" "$MODULE_CACHE"

if ! command -v swiftc >/dev/null 2>&1; then
  echo "未找到 swiftc，请先安装 Xcode Command Line Tools（xcode-select --install）" >&2
  exit 1
fi

TARGET_ARCH="$(uname -m)"
TARGET="${TARGET_ARCH}-apple-macosx13.0"

swiftc \
  -O \
  -swift-version 5 \
  -target "$TARGET" \
  -module-cache-path "$MODULE_CACHE" \
  -Xcc "-fmodules-cache-path=$MODULE_CACHE" \
  -o "$OUTPUT" \
  main.swift

echo "已构建：$OUTPUT" >&2
