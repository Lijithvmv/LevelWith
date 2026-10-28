#!/usr/bin/env node
// levelwith response-guard: a Claude Code Stop hook that lints the ASSISTANT'S OWN LAST REPLY before
// the turn can end. This is the piece the file-based gates miss: the overclaiming that does the harm
// arrives as a confident message in chat, not as a file someone declared. When my reply reports
// results (metrics/numbers presented as findings) but carries an unbacked inflation word or is
// missing the honesty block, the harness blocks me from stopping and feeds back what to fix — so it
// is caught at the moment it would reach you, with no one monitoring.
//
// Opt-in: active only when a file named `.levelwith-guard` exists in the session cwd (its contents do
// not matter). Scope: it only acts on replies that look like results-reporting (a deliberately narrow
// trigger, so ordinary conversation is not drowned in false positives).
//
// Progress guard: releases after MAX_BLOCKS consecutive blocks so it can never wedge a session.
//
// Privacy: it reads the local transcript file the harness points it at and runs entirely locally —
// nothing is sent anywhere. Honest limits: lexical only (a right-shaped claim still passes); it sees
// only text written to the transcript; the narrow trigger means a result stated without a trigger
// word slips by; and it is bypassable. It makes the common case catchable; it does not verify truth.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { checkText, looksResulty } from "./lib/check.mjs";

const MAX_BLOCKS = 5;

let raw = "";
try { raw = readFileSync(0, "utf8"); } catch { /* no stdin */ }
let ev = {};
try { ev = JSON.parse(raw || "{}"); } catch { /* not JSON */ }
const cwd = ev.cwd || process.cwd();

const allow = () => process.exit(0); // no stdout = allow the stop

if (!existsSync(join(cwd, ".levelwith-guard"))) allow();       // opt-in
const tpath = ev.transcript_path;
if (!tpath || !existsSync(tpath)) allow();                     // nothing to read

// Pull the last assistant text message out of the JSONL transcript.
let lastText = "";
try {
  for (const ln of readFileSync(tpath, "utf8").split(/\r?\n/)) {
    if (!ln.trim()) continue;
    let o; try { o = JSON.parse(ln); } catch { continue; }
    const msg = o.message || o;
    const isAssistant = o.type === "assistant" || msg.role === "assistant";
    if (!isAssistant || !msg.content) continue;
    const parts = Array.isArray(msg.content) ? msg.content : [msg.content];
    const txt = parts.map((p) => (typeof p === "string" ? p : p && p.type === "text" ? p.text : "")).join("\n").trim();
    if (txt) lastText = txt; // overwrite → ends on the final assistant text block
  }
} catch { allow(); }

if (!lastText || !looksResulty(lastText)) allow();             // only guard results-reporting replies

const violations = checkText(lastText, { forceReport: false });

// Block counter in the OS temp dir, keyed by session (or cwd) — never a stray file in the project,
// and one session's count can't leak into the next. Same convention as stop-hook.mjs.
const counterDir = join(tmpdir(), "levelwith");
const counterKey = createHash("sha1").update(ev.session_id || resolve(cwd)).digest("hex").slice(0, 16);
const counterFile = join(counterDir, `guardcount-${counterKey}`);
const saveCount = (n) => { try { mkdirSync(counterDir, { recursive: true }); writeFileSync(counterFile, String(n)); } catch { /* ignore */ } };

let count = 0;
try { count = parseInt(readFileSync(counterFile, "utf8"), 10) || 0; } catch { /* none */ }

if (!violations.length) { saveCount(0); allow(); }

count += 1;
if (count > MAX_BLOCKS) {
  // Release this one stop, then re-arm: the next stop starts a fresh cycle and blocks again.
  saveCount(0);
  process.stderr.write(`levelwith-guard: released after ${MAX_BLOCKS} blocks; your reply still fails the honesty check — fix it by hand.\n`);
  allow();
}
saveCount(count);

process.stdout.write(JSON.stringify({
  decision: "block",
  reason: "levelwith-guard: your reply reports results but fails the lexical honesty check — fix it before ending the turn (lexical only; it cannot tell if the content is true):\n\n" + violations.join("\n"),
}));
process.exit(0);
