# levelwith

Discipline aids for AI-assisted work, so an assistant's confident report has to meet a check before it counts.
Provisional name. Project-agnostic. Built after a long failure where an AI assistant's helpful-and-encouraging habit
drifted into overclaiming — calling things novel, best, working, or done more strongly than the evidence supported — <!-- levelwith-allow: lists the trigger words as examples -->
and a person made months of real decisions on that rosier picture.

**What this is honest about:** these tools make a violation *visible and catchable in one look*. They do **not**
guarantee honesty. A check can be the wrong check; a number stated in the right shape can still be wrong; `--no-verify`
skips the hook. The human is the backstop. If anything here claimed to "stop an AI fooling you," that claim would be
the very thing it is meant to expose.

## Part 1 — the push gate (this component, working and tested)

A git `pre-push` hook that blocks a push when a check you declare fails. Dependency-free (POSIX `sh`).

Install into any repo:

```
node scripts/install.mjs /path/to/your/repo
```

Then create a `.levelwith` file at that repo's root, one check command per line:

```
pytest -q
ruff check .
```

Now `git push` runs those checks first and stops if any fails. Bypass honestly with `git push --no-verify`.
`.github/workflows/checks.yml` runs the same `.levelwith` checks in CI, so the gate still holds for a `--no-verify` push.

Tested by `tests/test_pre_push.sh`: a failing check blocks, a passing check allows, no config is safe.

**Limits:** it runs the checks you declare and can't judge whether they are the right ones; `--no-verify` and direct
hook deletion bypass it; it is a discipline aid, not a security control.

## Part 2 — the claims skill (built and tested)

A Claude Code skill (`SKILL.md`) that fires when a report, result, release, or research conclusion is produced. It
requires a result block (`data type · weakest number first · n · what this does NOT show · tuned|unseen`), re-measuring
numbers before reporting, a release gate (an unseen number and a real-use measurement before publishing), and a
research gate ("what was cracked + evidence" or an explicit "nothing new"). <!-- levelwith-allow: lists trigger words below -->
The mechanical part, `scripts/levelwith-lint.mjs <file>`, flags the words novel/best/cracked/breakthrough/production-grade <!-- levelwith-allow: lists the trigger words as examples -->
unless a citation and a number are on the same line, and flags a results file missing the honesty block; it exits
non-zero so it can be a `.levelwith` gate. Fenced code and lines marked `levelwith-allow` are exempt (the exemption is
visible in the diff). Templates are in `templates/`. Same honest limit as Part 1: it checks form and words, not truth.

## Status
- Part 1 (push gate + CI template): built and tested locally (`tests/test_pre_push.sh`, incl. a real end-to-end push). Not published.
- Part 2 (claims skill + linter + templates): built and tested locally (`tests/test_lint.sh`). Not published.
- Completion discipline (ledger/gates for "is the work actually done") is covered by the separate `unlazy` project;
  this toolkit reuses that rather than duplicating it.
- Name `levelwith` is provisional. This is a local git repo; not yet pushed to GitHub.

