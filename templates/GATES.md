# GATES

Completion ledger. "Done" means every gate below is MET — a passing command, not a confident report.
Write the gates BEFORE the work, one observable outcome each. Do not silently delete a gate you can't
meet: that is not a pass.

Run from your project root:
    node <skill>/scripts/gate-check.mjs GATES.md --approve
where <skill> is where levelwith is installed, e.g. ~/.claude/skills/levelwith (use the full path; the
script lives in the skill folder, GATES.md lives here in your project).

The gates below are EXAMPLES — replace them with your project's own observable outcomes.

## G: the test suite passes
CHECK: <your test command, e.g. pytest -q  |  npm test --silent  |  go test ./...>
EXPECT: <a string that only appears on success, e.g. "passed" — omit this line to accept exit-0 alone>

## G: the thing actually runs / builds
CHECK: <your build or smoke command, e.g. npm run build  |  python -c "import yourpkg">
