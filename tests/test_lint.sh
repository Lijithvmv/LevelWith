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
echo "ALL PASS"
