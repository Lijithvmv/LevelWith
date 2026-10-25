#!/bin/sh
# Proves the pre-push gate's mechanism: blocks on a failing check, passes on a
# passing one, and is safe (no block) when there is no config. Run from anywhere:
#   REPO=/path/to/levelwith sh tests/test_pre_push.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
cd "$tmp"
git init -q
git config user.email t@example.com
git config user.name tester
node "$REPO/scripts/install.mjs" "$tmp" >/dev/null
hook="$tmp/.git/hooks/pre-push"
[ -f "$hook" ] || { echo "FAIL: hook not installed"; exit 1; }

# 1. a failing check must block (non-zero)
printf 'false\n' > .levelwith
if sh "$hook" origin x </dev/null >/dev/null 2>&1; then echo "FAIL: red check did not block the push"; exit 1; fi
echo "ok: a failing check blocks the push"

# 2. a passing check must allow (zero)
printf 'true\n' > .levelwith
if ! sh "$hook" origin x </dev/null >/dev/null 2>&1; then echo "FAIL: green check wrongly blocked"; exit 1; fi
echo "ok: a passing check allows the push"

# 3. no config must be safe (zero)
rm -f .levelwith
if ! sh "$hook" origin x </dev/null >/dev/null 2>&1; then echo "FAIL: no-config wrongly blocked"; exit 1; fi
echo "ok: no config is safe (does not block)"

echo "ALL PASS"
