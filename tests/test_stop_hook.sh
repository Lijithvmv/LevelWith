#!/bin/sh
# Proves the Stop hook: blocks when a declared report fails, allows when it passes or when there is
# no ledger, and releases after MAX_BLOCKS (progress guard).
#   REPO=/path/to/levelwith sh tests/test_stop_hook.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
hook="$REPO/scripts/stop-hook.mjs"

# node here is native-Windows; convert the MSYS temp path to a path it understands
run() { w=$(cygpath -m "$1" 2>/dev/null || echo "$1"); printf '{"cwd":"%s"}' "$w" | node "$hook"; }

# no ledger -> allow (empty stdout)
t=$(mktemp -d)
[ -z "$(run "$t")" ] || { echo "FAIL: no ledger should allow (empty output)"; exit 1; }
echo "ok: no ledger allows the stop"

# declared bad report -> block
t=$(mktemp -d); cp "$REPO/tests/fixtures/bad.md" "$t/report.md"; echo "report.md" > "$t/.levelwith-claims"
out=$(run "$t"); echo "$out" | grep -q '"decision":"block"' || { echo "FAIL: bad report did not block"; exit 1; }
echo "ok: a failing declared report blocks the stop"

# declared good report -> allow
t=$(mktemp -d); cp "$REPO/tests/fixtures/good.md" "$t/report.md"; echo "report.md" > "$t/.levelwith-claims"
[ -z "$(run "$t")" ] || { echo "FAIL: good report should allow"; exit 1; }
echo "ok: a passing declared report allows the stop"

# push-gate file and stop-hook ledger coexist (one is a file, the other is a separate file)
t=$(mktemp -d); cp "$REPO/tests/fixtures/good.md" "$t/report.md"; echo "report.md" > "$t/.levelwith-claims"; echo "echo ok" > "$t/.levelwith"
[ -z "$(run "$t")" ] || { echo "FAIL: ledger + push-gate config should coexist"; exit 1; }
echo "ok: .levelwith (push gate) and .levelwith-claims (stop hook) coexist"

# progress guard: 6th consecutive block with a bad report releases
t=$(mktemp -d); cp "$REPO/tests/fixtures/bad.md" "$t/report.md"; echo "report.md" > "$t/.levelwith-claims"
i=1; released=0
while [ $i -le 6 ]; do
  out=$(run "$t" 2>/dev/null)
  if [ -z "$out" ]; then released=1; break; fi
  i=$((i+1))
done
[ "$released" = 1 ] || { echo "FAIL: progress guard did not release after MAX_BLOCKS"; exit 1; }
echo "ok: progress guard releases after MAX_BLOCKS (block $i)"

echo "ALL PASS"
