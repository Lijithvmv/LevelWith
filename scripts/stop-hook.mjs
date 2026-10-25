#!/usr/bin/env node
// levelwith Stop hook for Claude Code.
// Blocks "stop" while any report file listed in the ledger fails the honesty linter.
//
// Opt-in: with no ledger (`.levelwith/claims` under the session cwd) it does nothing and allows the
// stop. List one report-file path per line in that ledger (# comments allowed) to have them enforced.
//
// Progress guard: after MAX_BLOCKS consecutive blocks it releases the stop (so it can never wedge a
// session), printing a note to stderr.
//
// Honest limit: it only checks the files you declare in the ledger. It cannot force a hidden report
// to be declared, and anyone who edits the ledger or the report can satisfy the form. The human is
// the backstop; this makes a failing declared report catchable before the agent stops.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BLOCKS = 5;

let raw = "";
try { raw = readFileSync(0, "utf8"); } catch { /* no stdin */ }
let event = {};
try { event = JSON.parse(raw || "{}"); } catch { /* not JSON */ }
const cwd = event.cwd || process.cwd();

const stateDir = join(cwd, ".levelwith");
const ledger = join(stateDir, "claims");
const counterFile = join(stateDir, ".stopcount");

const allow = () => process.exit(0); // no stdout = allow the stop

if (!existsSync(ledger)) allow();
const files = readFileSync(ledger, "utf8").split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
if (!files.length) allow();

const linter = join(dirname(fileURLToPath(import.meta.url)), "levelwith-lint.mjs");
const failures = [];
for (const f of files) {
  const p = resolve(cwd, f);
  if (!existsSync(p)) { failures.push(`${f}: listed in .levelwith/claims but not found`); continue; }
  try {
    execFileSync(process.execPath, [linter, p], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    failures.push(`${f}:\n${((e && e.stderr) || "").toString().trim()}`);
  }
}

let count = 0;
try { count = parseInt(readFileSync(counterFile, "utf8"), 10) || 0; } catch { /* none */ }

if (!failures.length) {
  try { writeFileSync(counterFile, "0"); } catch { /* ignore */ }
  allow();
}

count += 1;
try { mkdirSync(stateDir, { recursive: true }); writeFileSync(counterFile, String(count)); } catch { /* ignore */ }

if (count > MAX_BLOCKS) {
  process.stderr.write(`levelwith: released after ${MAX_BLOCKS} blocks; ${failures.length} declared report(s) still fail the honesty check — fix them by hand.\n`);
  allow();
}

process.stdout.write(JSON.stringify({
  decision: "block",
  reason: "levelwith: a declared report fails the honesty check — fix it before stopping (or edit .levelwith/claims):\n\n" + failures.join("\n\n"),
}));
process.exit(0);
