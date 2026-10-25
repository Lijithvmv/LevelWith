#!/usr/bin/env node
// levelwith completion-gate: proves work is actually done against a ledger of runnable checks,
// instead of trusting a confident "done" report. Covers G4 (unverified assertion) and G9
// (corner-cutting) for the part a command can decide.
//
// Prior art / inspiration: unlazy (https://github.com/Leonxlnx/unlazy) uses a GATES.md ledger with
// CHECK:/EXPECT: and judges a gate met only on exit-0 AND an expected-output match. This is a small,
// independent implementation of that pattern, not a copy of its code.
//
// Ledger format (GATES.md):
//   ## G: one observable outcome, in plain words
//   CHECK: <shell command>
//   EXPECT: <substring stdout must contain>        (optional; if omitted, exit-0 alone is the pass)
//
// A gate is MET only if CHECK exits 0 AND (no EXPECT, or EXPECT appears in its stdout). A gate with
// no CHECK is UNRUNNABLE and counts as NOT met (you cannot claim done on an unprovable gate).
//
// Usage:
//   node scripts/gate-check.mjs GATES.md            # list gates + commands, run nothing, exit 2
//   node scripts/gate-check.mjs GATES.md --approve  # run the checks; exit non-zero if any gate unmet
//
// The two-step --approve gate is deliberate: ledger commands are untrusted code (SECURITY.md). Read
// them before approving. Honest limit: it proves the gates you wrote passed; it cannot tell whether
// they are the right gates, and editing the ledger can fake it. The human is the backstop.
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

const file = process.argv[2];
const approve = process.argv.includes("--approve");
if (!file) { console.error("usage: gate-check.mjs GATES.md [--approve]"); process.exit(2); }
if (!existsSync(file)) { console.error(`gate-check: ${file} not found`); process.exit(2); }

const lines = readFileSync(file, "utf8").split(/\r?\n/);
const gates = [];
let cur = null;
for (const line of lines) {
  const title = line.match(/^##\s*G:\s*(.+)$/);
  if (title) { cur = { title: title[1].trim(), check: null, expect: null }; gates.push(cur); continue; }
  if (!cur) continue;
  const c = line.match(/^\s*CHECK:\s*(.+)$/);
  if (c) { cur.check = c[1].trim(); continue; }
  const e = line.match(/^\s*EXPECT:\s*(.+)$/);
  if (e) { cur.expect = e[1].trim(); continue; }
}

if (!gates.length) { console.error(`gate-check: no gates (## G: ...) in ${file}`); process.exit(2); }

if (!approve) {
  console.log(`gate-check: ${gates.length} gate(s) in ${file}. Review these commands, then re-run with --approve:\n`);
  for (const g of gates) {
    console.log(`  G: ${g.title}`);
    console.log(`     CHECK:  ${g.check ?? "(none — unrunnable, counts as NOT met)"}`);
    if (g.expect) console.log(`     EXPECT: ${g.expect}`);
  }
  process.exit(2);
}

let unmet = 0;
for (const g of gates) {
  if (!g.check) { console.error(`UNMET  ${g.title}  (no CHECK — unprovable)`); unmet++; continue; }
  let out = "", ok = false;
  try { out = execSync(g.check, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); ok = true; }
  catch (e) { out = ((e.stdout || "") + (e.stderr || "")).toString(); ok = false; }
  const expectOk = !g.expect || out.includes(g.expect);
  if (ok && expectOk) { console.log(`MET    ${g.title}`); }
  else {
    unmet++;
    const why = !ok ? "command exited non-zero" : `output did not contain EXPECT "${g.expect}"`;
    console.error(`UNMET  ${g.title}  (${why})`);
  }
}
if (unmet) { console.error(`\ngate-check: ${unmet}/${gates.length} gate(s) UNMET — not done.`); process.exit(1); }
console.log(`\ngate-check: all ${gates.length} gate(s) MET. (Proves the gates you wrote passed, not that they are the right gates.)`);
