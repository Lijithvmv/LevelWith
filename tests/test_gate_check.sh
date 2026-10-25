#!/bin/sh
# Proves the completion-gate: lists without --approve (exit 2), MET on a passing check, UNMET when
# the command fails, UNMET when EXPECT does not match, and UNMET for a gate with no CHECK.
#   REPO=/path/to/levelwith sh tests/test_gate_check.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
gc="$REPO/scripts/gate-check.mjs"

# without --approve: lists and exits 2, runs nothing
t=$(mktemp -d); printf '## G: ok\nCHECK: echo hello\nEXPECT: hello\n' > "$t/GATES.md"
if node "$gc" "$t/GATES.md" >/dev/null 2>&1; then echo "FAIL: should exit non-zero without --approve"; exit 1; fi
node "$gc" "$t/GATES.md" 2>&1 | grep -q "re-run with --approve" || { echo "FAIL: did not prompt for --approve"; exit 1; }
echo "ok: lists and refuses to run without --approve"

# --approve, all MET
node "$gc" "$t/GATES.md" --approve | grep -q "all 1 gate(s) MET" || { echo "FAIL: passing gate not MET"; exit 1; }
echo "ok: a passing check is MET"

# command fails -> UNMET
t=$(mktemp -d); printf '## G: fails\nCHECK: false\n' > "$t/GATES.md"
if node "$gc" "$t/GATES.md" --approve >/dev/null 2>&1; then echo "FAIL: failing command should be UNMET"; exit 1; fi
echo "ok: a failing command is UNMET"

# EXPECT mismatch -> UNMET
t=$(mktemp -d); printf '## G: wrong output\nCHECK: echo actual\nEXPECT: expected\n' > "$t/GATES.md"
if node "$gc" "$t/GATES.md" --approve >/dev/null 2>&1; then echo "FAIL: EXPECT mismatch should be UNMET"; exit 1; fi
echo "ok: an EXPECT mismatch is UNMET"

# no CHECK -> UNMET (unprovable)
t=$(mktemp -d); printf '## G: no check\n' > "$t/GATES.md"
out=$(node "$gc" "$t/GATES.md" --approve 2>&1 || true); echo "$out" | grep -q "no CHECK" || { echo "FAIL: missing CHECK not reported"; exit 1; }
echo "ok: a gate with no CHECK is UNMET (unprovable)"

echo "ALL PASS"
