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

// Capability claims — words that assert WHAT THE CODE DOES ("ai-scored", "agentic", ...). These are
// what the LexicalScorer-sold-as-"AI-scored" failure was built from: every slice was honestly green,
// but the sum carried a label the code did not earn. A citation+number does NOT back these — a number
// proves a measurement, not a mechanism. So they require a MECHANISM POINTER on the same line (a code
// path, a file, a CHECK/gate the reader can open in one look), or an explicit levelwith-allow.
// Honest limit: this is still lexical. It cannot tell that the pointed-to code is really a model call
// rather than a lexical stub — only a GATES.md CHECK that greps the active path can (see templates).
// It is a deliberately TIGHT list of near-unambiguous product claims; broad words ("intelligent",
// "semantic", "reasoning", "neural") are left out on purpose, because flagging them everywhere would
// drown ordinary prose in false positives — watch those by eye, the skill cannot without noise.
const CAPABILITY_TERMS = [
  /\bai[\s-]native\b/i, /\bai[\s-]scored\b/i, /\bai[\s-]powered\b/i, /\bai[\s-]driven\b/i,
  /\bai[\s-]based\b/i, /\bllm[\s-]powered\b/i, /\bml[\s-]powered\b/i, /\bagentic\b/i,
  /\bself[\s-]learning\b/i, /\bself[\s-]improving\b/i,
];
// A mechanism pointer: a backticked identifier, a code file/path, or an explicit mechanism/CHECK/gate
// marker. It lets a reader go verify the claim against the code — it does not verify it for them.
const MECH = /`[^`]+`|[\w./\\-]+\.(py|mjs|cjs|js|ts|tsx|jsx|go|rs|java|rb|ipynb|c|cpp|h)\b|\bmechanism:|\bCHECK:|\bGATES\.md\b/i;
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
    if (!justified) {
      if (BEST.test(line)) violations.push(`line ${i + 1}: inflation word "best" without a citation + number on the line`);
      for (const t of WORD_TERMS) {
        if (new RegExp(`\\b${t}\\b`, "i").test(line)) violations.push(`line ${i + 1}: inflation word "${t}" without a citation + number on the line`);
      }
      for (const p of PHRASE_TERMS) {
        if (low.includes(p)) violations.push(`line ${i + 1}: inflation phrase "${p}" without a citation + number on the line`);
      }
    }
    // Capability claims escape via a MECHANISM pointer, not a citation+number — a number does not
    // prove a mechanism. (The LexicalScorer-as-"AI-scored" failure stated honest numbers all along.)
    if (!MECH.test(line)) {
      for (const re of CAPABILITY_TERMS) {
        const m = line.match(re);
        if (m) violations.push(`line ${i + 1}: capability claim "${m[0]}" without a mechanism pointer (a code path / file / CHECK, or levelwith-allow) on the line — a number does not back a "what the code does" claim`);
      }
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
    // "center vs substrate" is the proxy-substitution guard (the deepest miss): did a CORE capability's
    // measured status change, or only its scaffolding? "did I ship something" quietly replacing "is this
    // the thing I set out to build". Human-judged — it checks the question is present and answered, not
    // that the answer is honest. "substrate only, center still empty" is a valid, required-allowed answer.
    const review = [["padding", /padding/i], ["goal", /\bgoal\b/i],
      ["proactive disclosure", /proactiv/i], ["decision", /decision/i],
      ["center vs substrate", /\b(center|centre|substrate)\b/i]];
    for (const [name, re] of review) {
      const hit = lines.find((l) => re.test(l) && /\?/.test(l));
      if (!hit) { violations.push(`self-review missing: the "${name}" question`); continue; }
      const tail = hit.replace(/.*\?/, "").trim();
      if (!tail || /^<.*>$/.test(tail)) violations.push(`self-review not answered: the "${name}" question`);
    }
  }

  return violations;
}
