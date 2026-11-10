#!/usr/bin/env bash
# 会议记录录音辅助程序自测脚本。
#
# 覆盖：
#   1) 参数校验：两路都关必须报错并非 0 退出
#   2) 主用例：播放提示音的同时录 5 秒（系统音频 + 麦克风混音）
#      校验 PCM 非静音、时长与实际耗时一致、stderr 全是合法 JSON 且事件齐全
#   3) stdin EOF 正常停止
#   4) SIGINT 正常停止
#
# 依赖：swiftc（构建）、python3（分析 PCM/JSON）、afplay（播放提示音，缺省时自动跳过放音）
set -uo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
BIN="$DIR/.build/meeting-recorder"

if [[ ! -x "$BIN" ]] || [[ "$DIR/main.swift" -nt "$BIN" ]]; then
  echo "==> 构建录音程序"
  bash "$DIR/build.sh" || { echo "构建失败"; exit 1; }
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "缺少 python3，无法自测" >&2
  exit 1
fi

WORK="$(mktemp -d "${TMPDIR:-/tmp}/meeting-recorder-test.XXXXXX")"
FAILED=0
PASS_COUNT=0
FIFO_PIDS=()
LAST_PLAYER=""
cleanup() {
  for pid in "${FIFO_PIDS[@]:-}"; do
    [[ -n "${pid:-}" ]] && kill "$pid" 2>/dev/null
  done
  rm -rf "$WORK"
}
trap cleanup EXIT

pass() { printf '  \033[32m✓\033[0m %s\n' "$*"; PASS_COUNT=$((PASS_COUNT + 1)); }
fail() { printf '  \033[31m✗\033[0m %s\n' "$*"; FAILED=1; }

# 播放若干提示音（后台），保证系统音频通道有真实声音
play_sounds() {
  if ! command -v afplay >/dev/null 2>&1; then return 0; fi
  (
    for sound in Submarine Ping Funk Glass Basso; do
      afplay "/System/Library/Sounds/${sound}.aiff" >/dev/null 2>&1
    done
  ) &
  LAST_PLAYER=$!
}

echo "1) 参数校验"
"$BIN" --system 0 --mic 0 >/dev/null 2>"$WORK/args.err"
if [[ $? -ne 0 ]]; then pass "两路都关：非 0 退出"; else fail "两路都关应非 0 退出"; fi
if grep -q '"type":"error"' "$WORK/args.err"; then pass "两路都关：输出 error JSON"; else fail "两路都关：缺少 error JSON"; fi

"$BIN" --sample-rate 999 >/dev/null 2>"$WORK/rate.err"
if [[ $? -ne 0 ]]; then pass "非法采样率：非 0 退出"; else fail "非法采样率应非 0 退出"; fi

echo "2) 5 秒混音录音（系统音频 + 麦克风）"
PCM="$WORK/rec.pcm"
ERR="$WORK/rec.err"
FIFO="$WORK/stdin.fifo"
mkfifo "$FIFO"

play_sounds
"$BIN" --sample-rate 16000 --system 1 --mic 1 <"$FIFO" >"$PCM" 2>"$ERR" &
REC_PID=$!
FIFO_PIDS+=("$REC_PID")
exec 9>"$FIFO"

for _ in $(seq 200); do
  grep -q '"type":"ready"' "$ERR" 2>/dev/null && break
  sleep 0.05
done
START="$(python3 -c 'import time;print(time.time())')"
sleep 5
printf '{"cmd":"stop"}\n' >&9
wait "$REC_PID"
REC_CODE=$?
END="$(python3 -c 'import time;print(time.time())')"
exec 9>&-
kill "$LAST_PLAYER" 2>/dev/null
wait "$LAST_PLAYER" 2>/dev/null

python3 - "$PCM" "$ERR" "$START" "$END" "$REC_CODE" <<'PY'
import json, math, struct, sys

pcm_path, err_path, start, end, code = sys.argv[1:6]
start, end, code = float(start), float(end), int(code)
problems = []

raw = open(pcm_path, "rb").read() if __import__("os").path.exists(pcm_path) else b""
frames = len(raw) // 2
seconds = frames / 16000.0
samples = struct.unpack("<%dh" % frames, raw[: frames * 2]) if frames else ()
peak = (max(abs(s) for s in samples) / 32768.0) if samples else 0.0
rms = (math.sqrt(sum((s / 32768.0) ** 2 for s in samples) / frames)) if frames else 0.0
wall = end - start

if code != 0:
    problems.append(f"退出码应为 0，实际 {code}")
if len(raw) % 2 != 0:
    problems.append(f"PCM 字节数 {len(raw)} 不是 s16le 的整数倍")
if seconds < 3.0:
    problems.append(f"录制时长过短：{seconds:.2f}s")
if abs(seconds - wall) > max(1.5, wall * 0.25):
    problems.append(f"时长偏差过大：PCM {seconds:.2f}s vs 实际 {wall:.2f}s")
if peak <= 0.05:
    problems.append(f"PCM 疑似静音：peak={peak:.3f}（应 > 0.05）")

lines = [line for line in open(err_path, encoding="utf-8").read().splitlines() if line.strip()]
events = []
for index, line in enumerate(lines):
    try:
        events.append(json.loads(line))
    except json.JSONDecodeError as error:
        problems.append(f"第 {index + 1} 行 stderr 不是合法 JSON: {error}")
        break

types = [event.get("type") for event in events]
if not events:
    problems.append("stderr 没有任何事件")
else:
    if types[0] != "ready":
        problems.append(f"首个事件应为 ready，实际 {types[0]}")
    if types[-1] != "stopped":
        problems.append(f"最后事件应为 stopped，实际 {types[-1]}")
    if "level" not in types:
        problems.append("缺少 level 事件")
    level_count = types.count("level")
    rate = level_count / seconds if seconds > 0 else 0
    if not (5 <= rate <= 15):
        problems.append(f"level 频率异常：{rate:.1f} Hz（应约 10Hz）")
    ready = events[0] if events else {}
    if ready.get("sampleRate") != 16000:
        problems.append(f"ready.sampleRate 应为 16000，实际 {ready.get('sampleRate')}")

print(
    f"  实测：{frames} 帧 / {seconds:.3f}s / peak={peak:.3f} / rms={rms:.4f} / "
    f"实际耗时 {wall:.3f}s / stderr {len(lines)} 行（level {types.count('level')}，"
    f"{types.count('level') / seconds:.1f}Hz）"
)
if problems:
    for problem in problems:
        print(f"  ✗ {problem}")
    sys.exit(1)
sys.exit(0)
PY
if [[ $? -eq 0 ]]; then pass "PCM 非静音、时长与事件流全部符合预期"; else fail "主用例校验未通过"; fi

echo "3) stdin EOF 停止"
"$BIN" --system 1 --mic 0 </dev/null >"$WORK/eof.pcm" 2>"$WORK/eof.err"
if [[ $? -eq 0 ]]; then pass "EOF：exit 0"; else fail "EOF：退出码非 0"; fi
if [[ "$(tail -n 1 "$WORK/eof.err")" == '{"type":"stopped"}' ]]; then
  pass "EOF：以 stopped 结束"
else
  fail "EOF：最后一行不是 stopped"
fi

echo "4) SIGINT 停止"
mkfifo "$WORK/sig.fifo"
"$BIN" --system 1 --mic 0 <"$WORK/sig.fifo" >"$WORK/sig.pcm" 2>"$WORK/sig.err" &
REC_PID=$!
FIFO_PIDS+=("$REC_PID")
exec 8>"$WORK/sig.fifo"
for _ in $(seq 100); do
  grep -q '"type":"ready"' "$WORK/sig.err" 2>/dev/null && break
  sleep 0.05
done
sleep 1
kill -INT "$REC_PID" 2>/dev/null
wait "$REC_PID"
if [[ $? -eq 0 ]]; then pass "SIGINT：exit 0"; else fail "SIGINT：退出码非 0"; fi
exec 8>&-
if [[ "$(tail -n 1 "$WORK/sig.err")" == '{"type":"stopped"}' ]]; then
  pass "SIGINT：以 stopped 结束"
else
  fail "SIGINT：最后一行不是 stopped"
fi
if python3 -c '
import json,sys
for line in open(sys.argv[1],encoding="utf-8"):
    line=line.strip()
    if line: json.loads(line)
' "$WORK/sig.err"; then
  pass "SIGINT：stderr 全部为合法 JSON"
else
  fail "SIGINT：stderr 存在非法 JSON"
fi

echo
if [[ $FAILED -eq 0 ]]; then
  printf '\033[32m全部自测通过\033[0m（%d 项）\n' "$PASS_COUNT"
  exit 0
else
  printf '\033[31m自测存在失败项\033[0m\n'
  exit 1
fi
