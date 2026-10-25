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

### The Stop hook (enforce, not just advise)

`SKILL.md` and the linter *advise*; a Claude Code **Stop hook** makes the linter *block*. List the report files to
enforce in `.levelwith/claims` (one path per line); when the assistant tries to end its turn, the hook runs the linter
on each and blocks the stop while any fails, feeding back what to fix. A progress guard releases after 5 consecutive
blocks so it can never wedge a session. It is **opt-in**: with no `.levelwith/claims`, the hook does nothing.

```
node scripts/install-stop-hook.mjs                 # print the settings.json snippet to paste
node scripts/install-stop-hook.mjs --write <dir>   # merge it into <dir>/.claude/settings.json (appends; idempotent)
```

Tested by `tests/test_stop_hook.sh` (blocks on a failing declared report, allows on a passing one, releases after the
guard) and `tests/test_install_stop_hook.sh`. **Honest limit:** it only checks files you declare in the ledger — it
can't force a hidden report to be declared, and editing the ledger or the report satisfies the form. Same as unlazy's
stated limit: structure, not truth.

## Part 3 — the completion-gate (is the work actually done?)

The linter checks what a report *says*; the completion-gate checks what the work actually *did*. You write a `GATES.md`
ledger **before** the work — one observable outcome per gate, each with a runnable `CHECK:` command and an optional
`EXPECT:` substring. A gate is MET only if the command exits 0 **and** its output contains `EXPECT`. A gate with no
`CHECK:` is unprovable and counts as **not** met, so you cannot declare "done" on something you never checked.

```
node scripts/gate-check.mjs GATES.md            # list the gates and their commands, run nothing
node scripts/gate-check.mjs GATES.md --approve  # run them; exits non-zero if any gate is unmet
```

The two-step `--approve` is deliberate: a ledger's commands are untrusted code (see SECURITY.md) — read them first.
Put `node scripts/gate-check.mjs GATES.md --approve` in your `.levelwith` so a push (and CI) is blocked until the work
is genuinely done. Tested by `tests/test_gate_check.sh`. Template in `templates/GATES.md`.

**Credit:** this is a small, independent implementation of the ledger-with-runnable-checks pattern from
[unlazy](https://github.com/Leonxlnx/unlazy) — none of its code is copied. unlazy additionally covers multi-agent
orchestration and dispatch; if you want that, use unlazy alongside this. **Honest limit:** the gate proves the checks
you wrote passed, not that they are the right checks; editing the ledger fakes it. Form, not truth.

## Coverage vs the twelve failure modes

Honest map of what the toolkit does to each failure. "Mechanical" = a command decides it. "Visible" = the linter flags
a form/word issue a human then judges. "Human-judged" = a required step, but no script can decide it — do not read
these rows as solved.

| # | Failure | How it's handled here | Honesty of coverage |
|---|---|---|---|
| G1 | Overclaiming | linter flags inflation words without a citation+number | Visible — a fresh phrasing can still slip by |
| G2 | Misleading evidence | linter requires a data-type + tuned/unseen label on results | Visible — checks the label exists, not that it's honest |
| G3 | Weakness-hiding | linter requires "weakest" + a "does NOT show" line | Visible — checks presence, not that the weak number leads |
| G4 | Unverified assertion | **completion-gate**: a claimed outcome needs a passing `CHECK` | **Mechanical** (for what a command can test) |
| G5 | Padding | `--report` self-review question | Human-judged — checks it's answered, not that it's true |
| G6 | Premature finality | push-gate/CI block red; release-gate asks for an unseen + real-use number | Mixed — red is mechanical, the "ready" bar is human-judged |
| G7 | Goal drift | `--report` self-review question | Human-judged |
| G8 | Imitation over understanding | `novel/cracked` flagged without a prior-art cite; research-gate wants mechanism-or-"nothing new" | Visible |
| G9 | Corner-cutting | **completion-gate**: each part is a gate; "done" = all MET, not a surface claim | **Mechanical** (to the extent gates enumerate the parts) |
| G10 | Operational carelessness | **push-gate blocks red; CI re-runs server-side** | **Mechanical — strongest** |
| G11 | Reactive honesty | `--report` self-review question | Human-judged |
| G12 | Compounded harm | `--report` "what decision rests on this" question | Human-judged |

Three of the twelve (G4, G9, G10) are genuinely mechanical; four more are made visible; the rest are required-but-human
(G5, G7, G11, G12, and half of G6). Nothing here verifies truth — only form and runnable checks. That boundary is the
point, not a gap to paper over.

## Install as a Claude Code skill

To make `/levelwith` available to an assistant, the skill folder must live where Claude Code looks for skills:

- **User-level (all your projects):** copy or symlink this repo to `~/.claude/skills/levelwith` (on Windows,
  `%USERPROFILE%\.claude\skills\levelwith`; a directory junction works too). `SKILL.md` must be at that folder's root.
- **Project-level (one repo):** copy or symlink it to that repo's `.claude/skills/levelwith`.

Then start a new session and type `/levelwith`, or let it trigger from its description when you produce a report,
result, release, or research conclusion. The push gate (Part 1) and the Stop hook are installed separately, per repo,
with the `scripts/install*.mjs` commands above — the skill itself does not install hooks without you running those.

## Status
- Part 1 (push gate + CI template): built and tested locally (`tests/test_pre_push.sh`, incl. a real end-to-end push). Not published.
- Part 2 (claims skill + linter + templates): built and tested locally (`tests/test_lint.sh`). Not published.
- Stop hook + installer: built and tested locally (`tests/test_stop_hook.sh`, `tests/test_install_stop_hook.sh`).
- Completion-gate: built and tested locally (`tests/test_gate_check.sh`). Independent implementation of unlazy's
  ledger pattern; unlazy remains the richer tool for orchestration and is credited above.
- `tests/run-all.sh` runs every suite; the repo dogfoods its own gate via `.levelwith` (push + CI).
- Name `levelwith` is provisional. Published at github.com/Lijithvmv/LevelWith; the `/levelwith` skill trigger in a
  fresh Claude Code session has not yet been verified by the author.

