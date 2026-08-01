/**
 * Generates public/essential-words/level-index.json — a slim projection of the Core
 * 1000 dataset carrying only what per-CEFR-level progress needs.
 *
 * The home card (components/home/LevelProgressBreakdown.tsx) used to fetch the
 * full dataset (~932KB) to render five progress bars, but tallyLevelProgress
 * reads just `word` and `cefr_level` — 2 of 10 fields. This projection is ~45KB.
 *
 * Regenerate after editing any words-*.json:
 *   node scripts/essential-words/generate-level-index.mjs
 *
 * `lib/essential-words/__tests__/level-index.test.ts` fails if this file drifts from
 * the chunks, so a stale index cannot ship silently.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const DIR = path.join(ROOT, "public", "essential-words");
const OUT = path.join(DIR, "level-index.json");

/** Reads words-001.json… in order, stopping at the first missing chunk. */
export function readChunkEntries(dir = DIR) {
  const entries = [];
  for (let n = 1; ; n++) {
    const file = path.join(dir, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    entries.push(...(parsed.entries ?? []));
  }
  return entries;
}

/**
 * Projects entries to [word, cefr_level] pairs. Array-of-tuples rather than
 * array-of-objects: it drops the repeated keys, roughly halving the payload.
 */
export function buildLevelIndex(entries) {
  return {
    version: 1,
    entries: entries.map((e) => [e.word, e.cefr_level]),
  };
}

function main() {
  const entries = readChunkEntries();
  if (entries.length === 0) {
    console.error("[essential-words] no chunks found — nothing to generate");
    process.exit(1);
  }

  const index = buildLevelIndex(entries);
  fs.writeFileSync(OUT, `${JSON.stringify(index)}\n`);

  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log(`[essential-words] wrote level-index.json — ${index.entries.length} entries, ${kb} KB`);
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("generate-level-index.mjs")) {
  main();
}
