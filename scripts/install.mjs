#!/usr/bin/env node
// levelwith installer: copy the pre-push gate into a target repo's .git/hooks.
// Usage: node scripts/install.mjs [path-to-repo] [--force]
// Default path-to-repo is the current directory.
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, chmodSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "..", "hooks", "pre-push");
const args = process.argv.slice(2);
const force = args.includes("--force");
const target = args.find((a) => !a.startsWith("--")) || process.cwd();

let gitDir;
try {
  gitDir = execSync("git rev-parse --absolute-git-dir", { cwd: target }).toString().trim();
} catch {
  console.error(`levelwith: ${target} is not a git repository.`);
  process.exit(2);
}

const dest = join(gitDir, "hooks", "pre-push");
if (existsSync(dest) && !force) {
  const current = readFileSync(dest, "utf8");
  if (!current.includes("levelwith")) {
    console.error(`levelwith: a different pre-push hook already exists at ${dest}.`);
    console.error("levelwith: inspect it, then re-run with --force to overwrite, or merge by hand.");
    process.exit(3);
  }
}

copyFileSync(src, dest);
try { chmodSync(dest, 0o755); } catch { /* Windows: ignore */ }
console.log(`levelwith: installed pre-push gate -> ${dest}`);
console.log("levelwith: now create a `.levelwith` file at the repo root, one check command per line, e.g.:");
console.log("        pytest -q");
console.log("        ruff check .");
console.log("levelwith: honest limits — it runs the checks you declare, can't judge if they're the right ones, and `git push --no-verify` skips it.");
