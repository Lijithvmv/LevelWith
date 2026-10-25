# Security model

levelwith is a local discipline aid, not a security control. This file states what it does and does not protect
against, so nobody relies on it for something it was never built to do.

## What it is
- Three dependency-free scripts run by Node and POSIX `sh`: a git `pre-push` hook, a lexical linter, and a Claude Code
  Stop hook, plus an installer for each.
- No network calls, no telemetry, no data egress, no third-party dependencies. It reads and writes only files under the
  repo/session directory you point it at (the `.levelwith` config, the `.levelwith/claims` ledger, `.claude/settings.json`,
  and the `.git/hooks/pre-push` it installs).

## What it protects against
- An assistant (or a person) *silently* shipping a push on red: the pre-push hook and CI template block it.
- A confident report or release going out without the required honesty block or carrying unbacked inflation words: the
  linter flags it, and the Stop hook can block the turn until a declared report passes.

## What it does NOT protect against (by design)
- **Dishonest content in the right shape.** The linter is lexical. A false number stated with a data-type label, an
  "unseen" tag, and a citation passes. It catches form and banned words, not truth. The human is the backstop.
- **Bypass.** `git push --no-verify` skips the pre-push hook; deleting `.git/hooks/pre-push` removes it; the Stop hook
  releases after 5 consecutive blocks (progress guard) and does nothing without a `.levelwith/claims` ledger. These are
  intentional escape hatches, not vulnerabilities — but they mean the tool cannot *force* anything.
- **A hidden report.** The Stop hook only checks files listed in the ledger. Anyone who can edit the ledger or the
  report can satisfy it. It makes a declared failing report catchable; it cannot surface one you never declared.

## Trust boundary: the scripts run commands from repo files
- The pre-push hook executes each line of `.levelwith` as a shell command. The Stop hook runs the linter (via
  `execFileSync`, not a shell, so a crafted filename is passed as an argument, not interpreted) on each path in
  `.levelwith/claims`. The installer merges into `.claude/settings.json`.
- **Therefore: treat `.levelwith`, `.levelwith/claims`, and any `.claude/settings.json` from a cloned or untrusted repo
  as untrusted code.** Review them before you push or run a session in that repo, exactly as you would review a
  Makefile or a git hook. Do not install these hooks into a repo you do not trust.
- The installer refuses to clobber a non-levelwith `pre-push` hook without `--force`, and the Stop-hook installer
  appends (never overwrites) existing Stop hooks and is idempotent.

## Reporting
This is a personal project with no published release. If it is ever published and you find an issue, open an issue on
the repository describing it. There is no security SLA.
