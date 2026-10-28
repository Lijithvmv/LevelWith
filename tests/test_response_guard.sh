#!/bin/sh
# Proves the response-guard Stop hook: off without .levelwith-guard; blocks a results reply that
# overclaims; allows an honest results reply; ignores non-results chat; releases after MAX_BLOCKS.
#   REPO=/path/to/levelwith sh tests/test_response_guard.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
guard="$REPO/scripts/response-guard.mjs"
win() { cygpath -m "$1" 2>/dev/null || echo "$1"; }

# write a transcript whose LAST assistant message is $2
mk_tx() {
  printf '%s\n' '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"hi"}]}}' > "$1"
  node -e 'const fs=require("fs");fs.appendFileSync(process.argv[2],JSON.stringify({type:"assistant",message:{role:"assistant",content:[{type:"text",text:process.argv[1]}]}})+"\n")' "$2" "$1"
}
run() { printf '{"cwd":"%s","transcript_path":"%s"}' "$(win "$1")" "$(win "$2")" | node "$guard"; }

BAD="Our system is a novel breakthrough, best in the market, with recall 99% on the benchmark."
GOOD="Weakest first: recall 0.10 (data type: unseen, n=5). What this does NOT show: not adaptive. Benchmark results."
CHAT="I updated the readme and fixed a typo."

# 1. no .levelwith-guard -> allow even on a bad reply
t=$(mktemp -d); mk_tx "$t/tx" "$BAD"
[ -z "$(run "$t" "$t/tx")" ] || { echo "FAIL: guard acted without .levelwith-guard"; exit 1; }
echo "ok: off without .levelwith-guard"

# 2. guard on + overclaiming results reply -> block
touch "$t/.levelwith-guard"
echo "$(run "$t" "$t/tx")" | grep -q '"decision":"block"' || { echo "FAIL: did not block an overclaiming results reply"; exit 1; }
echo "ok: blocks an overclaiming results reply"

# 3. guard on + honest results reply -> allow
t=$(mktemp -d); touch "$t/.levelwith-guard"; mk_tx "$t/tx" "$GOOD"
[ -z "$(run "$t" "$t/tx")" ] || { echo "FAIL: blocked an honest results reply"; exit 1; }
echo "ok: allows an honest results reply"

# 4. guard on + non-results chat -> allow (narrow trigger)
t=$(mktemp -d); touch "$t/.levelwith-guard"; mk_tx "$t/tx" "$CHAT"
[ -z "$(run "$t" "$t/tx")" ] || { echo "FAIL: acted on ordinary non-results chat"; exit 1; }
echo "ok: ignores non-results chat"

# 5. progress guard releases after MAX_BLOCKS
t=$(mktemp -d); touch "$t/.levelwith-guard"; mk_tx "$t/tx" "$BAD"
i=1; released=0
while [ $i -le 6 ]; do [ -z "$(run "$t" "$t/tx" 2>/dev/null)" ] && { released=1; break; }; i=$((i+1)); done
[ "$released" = 1 ] || { echo "FAIL: progress guard did not release"; exit 1; }
echo "ok: progress guard releases after MAX_BLOCKS (block $i)"

echo "ALL PASS"
