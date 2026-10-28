#!/bin/sh
# Proves the Stop-hook installer: prints config without --write, merges into settings.json with
# --write, is idempotent, and preserves an existing unrelated Stop hook.
#   REPO=/path/to/levelwith sh tests/test_install_stop_hook.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
inst="$REPO/scripts/install-stop-hook.mjs"
win() { cygpath -m "$1" 2>/dev/null || echo "$1"; }

# no --write -> prints config, writes no file
t=$(mktemp -d)
node "$inst" | grep -q '"Stop"' || { echo "FAIL: did not print Stop config"; exit 1; }
[ ! -e "$t/.claude/settings.json" ] || { echo "FAIL: should not have written a file"; exit 1; }
echo "ok: prints config and writes nothing without --write"

# --write -> merges, keeping an existing unrelated Stop hook
t=$(mktemp -d); mkdir "$t/.claude"
printf '{"hooks":{"Stop":[{"hooks":[{"type":"command","command":"echo keep-me"}]}]}}' > "$t/.claude/settings.json"
node "$inst" --write "$(win "$t")" >/dev/null
grep -q "keep-me" "$t/.claude/settings.json" || { echo "FAIL: clobbered existing hook"; exit 1; }
grep -q "stop-hook.mjs" "$t/.claude/settings.json" || { echo "FAIL: did not add levelwith hook"; exit 1; }
echo "ok: merges and preserves an existing Stop hook"

# idempotent: second run adds nothing
node "$inst" --write "$(win "$t")" | grep -q "already present" || { echo "FAIL: not idempotent"; exit 1; }
n=$(grep -o "stop-hook.mjs" "$t/.claude/settings.json" | wc -l | tr -d ' ')
[ "$n" = "1" ] || { echo "FAIL: duplicated the hook ($n copies)"; exit 1; }
echo "ok: idempotent (one copy after two runs)"

# --guard wires response-guard.mjs, and coexists with the default stop hook
t=$(mktemp -d)
node "$inst" --guard | grep -q "response-guard.mjs" || { echo "FAIL: --guard did not reference response-guard.mjs"; exit 1; }
node "$inst" --write "$(win "$t")" >/dev/null                 # default stop hook
node "$inst" --guard --write "$(win "$t")" >/dev/null         # guard hook
grep -q "stop-hook.mjs" "$t/.claude/settings.json" || { echo "FAIL: default hook missing"; exit 1; }
grep -q "response-guard.mjs" "$t/.claude/settings.json" || { echo "FAIL: guard hook missing"; exit 1; }
node "$inst" --guard --write "$(win "$t")" | grep -q "already present" || { echo "FAIL: guard not idempotent"; exit 1; }
echo "ok: --guard installs response-guard.mjs and coexists with the default hook"

echo "ALL PASS"
