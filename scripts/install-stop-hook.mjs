#!/usr/bin/env node
// Wires the levelwith Stop hook into a project's .claude/settings.json.
//
//   node scripts/install-stop-hook.mjs                 # print the config to paste, do nothing
//   node scripts/install-stop-hook.mjs --write <dir>   # merge the hook into <dir>/.claude/settings.json
//   node scripts/install-stop-hook.mjs --guard [...]   # wire response-guard.mjs (lints my own reply)
//                                                        instead of stop-hook.mjs (lints declared files)
//
// Consent gate: it only writes when you pass --write with a target directory. Without it, it just
// prints the snippet so you can review and paste it yourself. It never overwrites other Stop hooks —
// it appends, and it is idempotent (running twice does not add a second copy).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const guard = args.includes("--guard");
const scriptName = guard ? "response-guard.mjs" : "stop-hook.mjs";
const hookPath = join(dirname(fileURLToPath(import.meta.url)), scriptName);
const command = `node ${JSON.stringify(hookPath).slice(1, -1)}`;
const entry = { hooks: [{ type: "command", command }] };

const writeAt = args.indexOf("--write");

if (writeAt === -1) {
  console.log(`levelwith Stop hook (${scriptName}) — add this to your project's .claude/settings.json:\n`);
  console.log(JSON.stringify({ hooks: { Stop: [entry] } }, null, 2));
  if (guard) console.log(`\nThen create an empty .levelwith-guard file in the project to turn it on.`);
  else console.log(`\nThen list the report files to enforce in .levelwith-claims (one path per line).`);
  console.log(`To write it for a project automatically:  node scripts/install-stop-hook.mjs ${guard ? "--guard " : ""}--write <project-dir>`);
  process.exit(0);
}

const dir = args[writeAt + 1];
if (!dir) { console.error("--write needs a target directory"); process.exit(1); }
const settingsDir = resolve(dir, ".claude");
const settingsFile = join(settingsDir, "settings.json");

let settings = {};
if (existsSync(settingsFile)) {
  try { settings = JSON.parse(readFileSync(settingsFile, "utf8")); }
  catch { console.error(`${settingsFile} is not valid JSON — fix or remove it first`); process.exit(1); }
}
settings.hooks ||= {};
settings.hooks.Stop ||= [];

const already = JSON.stringify(settings.hooks.Stop).includes(scriptName);
if (already) { console.log(`levelwith Stop hook (${scriptName}) already present in ${settingsFile} — nothing to do`); process.exit(0); }

settings.hooks.Stop.push(entry);
mkdirSync(settingsDir, { recursive: true });
writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + "\n");
console.log(`levelwith Stop hook (${scriptName}) written to ${settingsFile}`);
if (guard) console.log(`Create an empty ${join(resolve(dir), ".levelwith-guard")} to turn it on.`);
else console.log(`List the report files to enforce in ${join(resolve(dir), ".levelwith-claims")} (one path per line).`);
