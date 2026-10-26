#!/bin/sh
# Proves the docs match the code, so a rename or a promised check cannot silently drift.
#   REPO=/path/to/levelwith sh tests/test_docs.sh
set -e
REPO=${REPO:-"$(cd "$(dirname "$0")/.." && pwd)"}
cd "$REPO"

# the Stop-hook ledger was renamed to .levelwith-claims; no doc may still name the old path
if grep -n '\.levelwith/claims' README.md SECURITY.md SKILL.md templates/*.md; then
  echo "FAIL: a doc still names the old .levelwith/claims path"; exit 1
fi
grep -q '"\.levelwith-claims"' scripts/stop-hook.mjs || { echo "FAIL: stop hook no longer reads .levelwith-claims"; exit 1; }
echo "ok: docs and stop hook agree on the .levelwith-claims ledger"

# every inflation word SKILL.md/README.md promise to flag must actually be flagged by the linter
for w in novel best cracked breakthrough production-grade state-of-the-art promising; do
  t=$(mktemp); printf 'This system is %s.\n' "$w" > "$t"
  if node scripts/levelwith-lint.mjs "$t" >/dev/null 2>&1; then
    echo "FAIL: docs promise '$w' is flagged, but the linter passed it"; exit 1
  fi
done
echo "ok: every inflation word the docs promise is flagged"

echo "ALL PASS"
