// Shared lexical honesty check. Used by levelwith-lint.mjs (on a file) and response-guard.mjs
// (on my own last reply). It does NOT understand meaning — it flags form so a human can see it in
// one look: inflation words without a citation+number, and a results text missing the honesty block.
// A claim written in the right shape can still be false; this only removes easy hiding.

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
export const RESULTY = /(recall|precision|accuracy|\bf1\b|%|\bstopped\b|\bheld\b|benchmark|results?\b|attack)/i;

export function looksResulty(text) { return RESULTY.test(text); }

// Returns an array of human-readable violation strings (empty = passes).
export function checkText(text, { forceReport = false } = {}) {
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

  return violations;
}
