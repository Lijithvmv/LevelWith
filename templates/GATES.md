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

## G: a capability LABEL is backed by the mechanism it names (the anti-"AI-scored" gate)
<!-- This is the one gate that catches a label the code does not earn: the failure where a lexical
     string-matcher (`LexicalScorer`) was reported as "AI-scored". A CHECK that greps the ACTIVE code
     path must FIND the real mechanism and NOT find the stub. Make EXPECT the model call, and add a
     second CHECK whose success is the stub being ABSENT from the live path. Adapt to your code. -->
CHECK: grep -n "class .*Scorer" service.py; ! grep -q "LexicalScorer" service.py  # must exit 0: stub gone
EXPECT: <the real mechanism's identifier on the active path, e.g. "model.generate" — NOT the stub's name>
