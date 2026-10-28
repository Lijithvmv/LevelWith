#!/usr/bin/env node
// levelwith-lint: a blunt lexical check on a report/claim file. It does NOT understand meaning.
// It flags two things so a human can see them in one look:
//   1. inflation words (novel, best, cracked, breakthrough, production-grade, ...) used WITHOUT
//      a citation and a number on the same line;
//   2. a results file missing the required honesty block (data type, weakest number, what it does
//      NOT show, and a tuned/unseen tag).
// Exit non-zero if anything is flagged, so it can be used as a .levelwith gate:
//     node scripts/levelwith-lint.mjs REPORT.md [--report]
// The check itself lives in lib/check.mjs (shared with the response-guard Stop hook).
// Honest limit: a claim written in the right shape can still be false; this only removes easy hiding.
import { readFileSync } from "node:fs";
import { checkText } from "./lib/check.mjs";

const file = process.argv[2];
if (!file) { console.error("usage: levelwith-lint.mjs <file.md> [--report]"); process.exit(2); }
const forceReport = process.argv.includes("--report");
const text = readFileSync(file, "utf8");
const violations = checkText(text, { forceReport });

if (violations.length) {
  console.error(`levelwith-lint: ${violations.length} issue(s) in ${file}:`);
  for (const v of violations) console.error("  - " + v);
  console.error('levelwith-lint: fix, or justify an inflation word with a citation + number on the same line. This check is lexical; it cannot tell if the content is true.');
  process.exit(1);
}
console.log(`levelwith-lint: ${file} passes the lexical honesty check (form only, not truth).`);
