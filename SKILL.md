---
name: levelwith
description: >-
  Honesty discipline for reports, results, releases, and research conclusions. Use when about to
  state a result or number, claim something is new/working/done, announce a release, or conclude a
  research task. Forces the weakest truth first and a citation+number behind any strong word.
  Triggers: /levelwith, "levelwith", "honest report", "weakest first", "is this overclaiming".
---

# levelwith

Provisional name. A discipline aid, not a guarantee. It makes inflation **visible and catchable in one
look**; it cannot make a number honestly derived or a judgement sound. A claim in the right shape can
still be false — the reader stays the backstop. If this skill ever let a report *claim* it had proven
honesty, that would be the exact failure it exists to expose.

## Premise
State the weakest relevant number first. No strong word ("novel", "best", "cracked", "breakthrough", <!-- levelwith-allow -->
"production-grade", "state-of-the-art", "promising") without a citation and a measured number on the <!-- levelwith-allow -->
same line. Report only what a check supports. "Nothing new" / "it failed" / "unknown until tested" are
valid, required-allowed outcomes — never dress them up.

## When to use (the trigger moment)
Any time you are about to: present a result or table; call something new / working / ready / done;
announce or prepare a release; or write the conclusion of a research task.

## Modes (pick the smallest that fits)

### report — any result or number
Emit a result block (template `templates/report.md`) with, in this order:
1. **weakest relevant number first**;
2. **data type**: real-use / replay / tuned-on / held-out|unseen / synthetic / self-made, with n;
3. what the number **does NOT show**.
Re-measure every number at the moment of writing; do not quote a remembered figure. Then run the gate:
`node scripts/levelwith-lint.mjs <file>` must exit 0. Answer the self-review block (padding / goal / proactive
disclosure / what decision rests on this); `--report` checks each is answered — these are the failures no script judges.

### release — "ready" / "mature" / publish / tag
Blocked unless: at least one **unseen** (not tuned-on) number exists; a **real-use** measurement
exists; and the exact list of what becomes public has been shown and approved. Prepare, do not publish,
until a human approves. (Checklist: `templates/release.md`.)

### research — the conclusion of an investigation
End with either **"what was cracked"** (the new method/gap + its evidence + a prior-art citation) or an <!-- levelwith-allow -->
explicit **"nothing new"**. Reproducing a known method's name without its mechanism is a fail. A
prior-art check is done before claiming novelty, not after. (Template: `templates/research.md`.) <!-- levelwith-allow -->

### done — "complete" / "it works" / "all passing"
Do not claim done from a confident report. Write a `GATES.md` (template `templates/GATES.md`) — one observable
outcome per gate with a runnable `CHECK:` — and run `node scripts/gate-check.mjs GATES.md --approve`. "Done" means
every gate MET (exit 0 + EXPECT match); a gate with no CHECK is unprovable and counts as not met. This is the only
part that tests work rather than words (covers "unverified" and "corner-cut" for what a command can decide).

## The gate (mechanical part)
`scripts/levelwith-lint.mjs <file>` flags inflation words lacking a citation+number and a results file
missing the honesty block; `scripts/gate-check.mjs GATES.md --approve` proves declared outcomes actually passed. Both
exit non-zero so they can be a `.levelwith` check, a Stop-hook gate, or CI. Their limit, stated in their own output:
the lint is lexical and the gate only proves the checks you wrote — neither can tell if the content is true.

To make it *block* rather than advise, install the Stop hook (`node scripts/install-stop-hook.mjs`, opt-in,
consent-only) and list the report files to enforce in `.levelwith/claims`. See README and SECURITY.md.

## Honest limits
- Lexical, not semantic: right-shaped lies pass; obscure phrasings of inflation may slip by.
- Anyone who can edit the report can satisfy the form without the substance.
- It reduces and exposes the failure; it does not prevent it. Success = a violation is catchable by a
  person in one look, not that it became impossible.
