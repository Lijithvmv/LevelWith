#!/bin/sh
# Runs every levelwith test suite. Prints "ALL PASS" only if all of them pass (set -e stops on the
# first failure). Used by the GATES.md template and the repo's own .levelwith gate.
set -e
REPO="$(cd "$(dirname "$0")/.." && pwd)"
export REPO
for t in test_pre_push test_lint test_stop_hook test_install_stop_hook test_gate_check test_response_guard test_docs; do
  echo "== $t =="
  sh "$REPO/tests/$t.sh" >/dev/null
done
echo "ALL PASS"
