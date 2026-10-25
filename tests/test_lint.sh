#!/bin/sh
# Proves the linter flags an inflated report and passes an honest one.
#   REPO=/path/to/levelwith sh tests/test_lint.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
cd "$REPO"
if node scripts/levelwith-lint.mjs tests/fixtures/bad.md >/dev/null 2>&1; then
  echo "FAIL: inflated file was not flagged"; exit 1
fi
echo "ok: inflated file is flagged (non-zero)"
if ! node scripts/levelwith-lint.mjs tests/fixtures/good.md >/dev/null 2>&1; then
  echo "FAIL: honest file was wrongly flagged"; exit 1
fi
echo "ok: honest file passes"

# --report mode: the self-review questions must be present AND answered
body="# R
Weakest first: recall 0.23 (data type: unseen, n=10). What this does NOT show: not adaptive."
rev="## Honest self-review
- Padding? no
- Tied to the goal? yes
- Limits disclosed proactively? yes
- What decision will rest on this? the pilot go/no-go"

t=$(mktemp); printf '%s\n' "$body" > "$t"   # no self-review block
if node scripts/levelwith-lint.mjs "$t" --report >/dev/null 2>&1; then
  echo "FAIL: --report passed a report with no self-review"; exit 1
fi
echo "ok: --report flags a missing self-review"

t=$(mktemp); printf '%s\n- Padding? <answer>\n- goal? <answer>\n- proactively? <answer>\n- decision? <answer>\n' "$body" > "$t"  # placeholders
if node scripts/levelwith-lint.mjs "$t" --report >/dev/null 2>&1; then
  echo "FAIL: --report passed unanswered placeholders"; exit 1
fi
echo "ok: --report flags unanswered placeholders"

t=$(mktemp); printf '%s\n\n%s\n' "$body" "$rev" > "$t"  # answered
if ! node scripts/levelwith-lint.mjs "$t" --report >/dev/null 2>&1; then
  echo "FAIL: --report wrongly flagged an answered self-review"; exit 1
fi
echo "ok: --report passes an answered self-review"

echo "ALL PASS"
