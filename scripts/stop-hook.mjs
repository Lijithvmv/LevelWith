#!/usr/bin/env node
// levelwith Stop hook for Claude Code.
// Blocks "stop" while any report file listed in the ledger fails the honesty linter.
//
// Opt-in: with no ledger (`.levelwith-claims` under the session cwd) it does nothing and allows the
// stop. List one report-file path per line in that ledger (# comments allowed) to have them enforced.
// (The ledger is its own file, separate from the push-gate's `.levelwith` file, so a project can use
// both without one being a file and the other a directory.)
//
// Progress guard: after MAX_BLOCKS consecutive blocks it releases the stop (so it can never wedge a
// session), printing a note to stderr, then re-arms so the following stop is checked again.
//
// Honest limit: it only checks the files you declare in the ledger. It cannot force a hidden report
// to be declared, and anyone who edits the ledger or the report can satisfy the form. The human is
// the backstop; this makes a failing declared report catchable before the agent stops.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const MAX_BLOCKS = 5;

let raw = "";
try { raw = readFileSync(0, "utf8"); } catch { /* no stdin */ }
let event = {};
try { event = JSON.parse(raw || "{}"); } catch { /* not JSON */ }
const cwd = event.cwd || process.cwd();

const ledger = join(cwd, ".levelwith-claims");
// The block counter lives in the OS temp dir, keyed by session (or cwd), so the hook never writes
// a stray file into the user's project and one session's count cannot leak into the next.
const counterDir = join(tmpdir(), "levelwith");
const counterKey = createHash("sha1").update(event.session_id || resolve(cwd)).digest("hex").slice(0, 16);
const counterFile = join(counterDir, `stopcount-${counterKey}`);
const saveCount = (n) => { try { mkdirSync(counterDir, { recursive: true }); writeFileSync(counterFile, String(n)); } catch { /* ignore */ } };

const allow = () => process.exit(0); // no stdout = allow the stop

if (!existsSync(ledger)) allow();
const files = readFileSync(ledger, "utf8").split(/\r?\n/).map((s) => s.trim()).filter((s) => s && !s.startsWith("#"));
if (!files.length) allow();

const linter = join(dirname(fileURLToPath(import.meta.url)), "levelwith-lint.mjs");
const failures = [];
for (const f of files) {
  const p = resolve(cwd, f);
  if (!existsSync(p)) { failures.push(`${f}: listed in .levelwith-claims but not found`); continue; }
  try {
    execFileSync(process.execPath, [linter, p], { stdio: ["ignore", "ignore", "pipe"] });
  } catch (e) {
    failures.push(`${f}:\n${((e && e.stderr) || "").toString().trim()}`);
  }
}

let count = 0;
try { count = parseInt(readFileSync(counterFile, "utf8"), 10) || 0; } catch { /* none */ }

if (!failures.length) { saveCount(0); allow(); }

count += 1;
if (count > MAX_BLOCKS) {
  // Release this one stop, then re-arm: the next stop starts a fresh cycle and blocks again, so a
  // release is a one-time escape hatch, not a permanent off switch.
  saveCount(0);
  process.stderr.write(`levelwith: released after ${MAX_BLOCKS} blocks; ${failures.length} declared report(s) still fail the honesty check — fix them by hand.\n`);
  allow();
}
saveCount(count);

process.stdout.write(JSON.stringify({
  decision: "block",
  reason: "levelwith: a declared report fails the honesty check — fix it before stopping (or edit .levelwith-claims):\n\n" + failures.join("\n\n"),
}));
process.exit(0);
