# GATES

Completion ledger. "Done" means every gate below is MET — a passing command, not a confident report.
Write the gates BEFORE the work, one observable outcome each. Do not silently delete a gate you can't
meet: that is not a pass. Run with `node scripts/gate-check.mjs GATES.md --approve`.

## G: the test suite passes
CHECK: sh tests/run-all.sh
EXPECT: ALL PASS

## G: the report passes the honesty linter
CHECK: node scripts/levelwith-lint.mjs REPORT.md
EXPECT: passes
