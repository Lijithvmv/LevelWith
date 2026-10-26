#!/usr/bin/env node
// levelwith-lint: a blunt lexical check on a report/claim file. It does NOT understand meaning.
// It flags two things so a human can see them in one look:
//   1. inflation words (novel, best, cracked, breakthrough, production-grade, ...) used WITHOUT
//      a citation and a number on the same line;
//   2. a results file missing the required honesty block (data type, weakest number, what it does
//      NOT show, and a tuned/unseen tag).
// Exit non-zero if anything is flagged, so it can be used as a .levelwith gate:
//     node scripts/levelwith-lint.mjs REPORT.md
// Honest limit: a claim written in the right shape can still be false; this only removes easy hiding.
import { readFileSync } from "node:fs";

const WORD_TERMS = ["novel", "novelty", "cracked", "breakthrough", "revolutionary", "unmatched",
  "promising", "seamless", "effortless", "flawless", "robust"];
const PHRASE_TERMS = ["world-first", "world first", "first-ever", "first ever", "game-changer",
  "game changer", "best-in-class", "best in class", "best in the market", "state-of-the-art",
  "state of the art", "production-grade", "production grade", "nobody else", "no one else"];
// "best" on its own, minus the everyday idioms that make no claim (and the best-in-class phrase above).
const BEST = /(?<!\bat )\bbest\b(?![- ](practices?|effort|in[- ]class|in the market))/i;
const CITE = /(https?:\/\/|arxiv|\[\d+\]|\bcite:|\bprior[ -]art\b)/i;
// The number must be a measurement, not the citation itself: "[1]" or a URL's digits don't count.
const CITE_TOKENS = /https?:\/\/\S+|\[\d+\]|arxiv:?\s*[\d.v]+/gi;
const NUM = /\d/;
const RESULTY = /(recall|precision|accuracy|\bf1\b|%|\bstopped\b|\bheld\b|benchmark|results?\b|attack)/i;

const file = process.argv[2];
if (!file) { console.error("usage: levelwith-lint.mjs <file.md> [--report]"); process.exit(2); }
const forceReport = process.argv.includes("--report");
const text = readFileSync(file, "utf8");
const lines = text.split(/\r?\n/);
const violations = [];
let inFence = false;

lines.forEach((line, i) => {
  if (/^\s*```/.test(line)) { inFence = !inFence; return; }   // skip fenced code blocks
  if (inFence) return;
  if (/levelwith-allow/.test(line)) return;                      // explicit, visible exemption
  const low = line.toLowerCase();
  const justified = CITE.test(line) && NUM.test(line.replace(CITE_TOKENS, ""));
  if (justified) return;
  if (BEST.test(line)) violations.push(`line ${i + 1}: inflation word "best" without a citation + number on the line`);
  for (const t of WORD_TERMS) {
    if (new RegExp(`\\b${t}\\b`, "i").test(line)) violations.push(`line ${i + 1}: inflation word "${t}" without a citation + number on the line`);
  }
  for (const p of PHRASE_TERMS) {
    if (low.includes(p)) violations.push(`line ${i + 1}: inflation phrase "${p}" without a citation + number on the line`);
  }
});

if (forceReport || RESULTY.test(text)) {
  const need = [
    [/data[ -]?type|data:/i, 'a data-type label ("data type:" / real / replay / tuned / synthetic / n=...)'],
    [/weakest|weak(est)? number|lowest number first/i, 'the weakest number stated first (the word "weakest")'],
    [/does not show|doesn'?t show|not shown|limitation|caveat/i, 'a "what this does NOT show" line'],
    [/\b(tuned|unseen|held[- ]?out|synthetic|real[- ]use|replay|n\s*=\s*\d)\b/i, 'a tuned|unseen (or n=) tag'],
  ];
  for (const [re, label] of need) if (!re.test(text)) violations.push(`report is missing: ${label}`);
}

// --report only: the four human-judgment questions (G5/G7/G11/G12) must be present AND answered.
// This checks the answer is non-empty, NOT that it is honest — those failures no script can judge.
if (forceReport) {
  const review = [["padding", /padding/i], ["goal", /\bgoal\b/i],
    ["proactive disclosure", /proactiv/i], ["decision", /decision/i]];
  for (const [name, re] of review) {
    const hit = lines.find((l) => re.test(l) && /\?/.test(l));
    if (!hit) { violations.push(`self-review missing: the "${name}" question`); continue; }
    const tail = hit.replace(/.*\?/, "").trim();
    if (!tail || /^<.*>$/.test(tail)) violations.push(`self-review not answered: the "${name}" question`);
  }
}

if (violations.length) {
  console.error(`levelwith-lint: ${violations.length} issue(s) in ${file}:`);
  for (const v of violations) console.error("  - " + v);
  console.error('levelwith-lint: fix, or justify an inflation word with a citation + number on the same line. This check is lexical; it cannot tell if the content is true.');
  process.exit(1);
}
console.log(`levelwith-lint: ${file} passes the lexical honesty check (form only, not truth).`);
