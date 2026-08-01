/**
 * Backfill accurate per-word cefr_level for Core 1000 / NGSL chunk files.
 *
 * Motivation: chunks 1600–2800 (and 851–999) were generated with a crude
 * rank-based heuristic that stamped everything C1 (e.g. "breakfast", "angry"
 * flagged C1). This replaces cefr_level for every word with an authoritative
 * per-word value from the Oxford 5000 CEFR list, plus a curated override map
 * for words absent from that list (American spellings, morphological variants,
 * meta terms).
 *
 * Data sources (both committed under data/):
 *   - oxford-5000-cefr.json  word -> lowest CEFR (A1-C1).
 *       Derived from github.com/winterdl/oxford-5000-vocabulary-audio-definition
 *       (data/oxford_5000.json). To regenerate the base map, re-download that
 *       file and keep the lowest CEFR per word (folding C2 into C1).
 *   - cefr-overrides.json    word -> CEFR for the ~68 NGSL words not in Oxford.
 *
 * Resolution order per word: overrides -> oxford -> keep existing value.
 * Only cefr_level is touched. Rebuilds words-all.json from the chunks.
 *
 * Usage:
 *   node scripts/essential-words/backfill-cefr.mjs            # apply
 *   node scripts/essential-words/backfill-cefr.mjs --dry-run  # report only
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");
const DATA_DIR = path.join(__dirname, "data");

const dryRun = process.argv.includes("--dry-run");

const VALID = new Set(["A1", "A2", "B1", "B2", "C1"]);

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function buildLevelMap() {
  const oxford = loadJson(path.join(DATA_DIR, "oxford-5000-cefr.json")).levels ?? {};
  const overridesRaw = loadJson(path.join(DATA_DIR, "cefr-overrides.json"));
  const map = new Map();
  for (const [word, level] of Object.entries(oxford)) {
    if (VALID.has(level)) map.set(word.toLowerCase(), level);
  }
  // Overrides win over the base list.
  for (const [word, level] of Object.entries(overridesRaw)) {
    if (word.startsWith("_")) continue;
    if (!VALID.has(level)) throw new Error(`Invalid override CEFR for "${word}": ${level}`);
    map.set(word.toLowerCase(), level);
  }
  return map;
}

function resolveLevel(map, word) {
  return map.get(word.toLowerCase()) ?? null;
}

function patchChunk(chunkNum, map, stats) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return false;

  const data = loadJson(file);
  let changed = 0;

  for (const entry of data.entries) {
    const next = resolveLevel(map, entry.word);
    if (!next) {
      stats.unmatched.push(`${entry.rank}:${entry.word}`);
      continue;
    }
    if (next !== entry.cefr_level) {
      stats.changes.push({ rank: entry.rank, word: entry.word, from: entry.cefr_level, to: next });
      entry.cefr_level = next;
      changed++;
    }
  }

  if (!dryRun && changed > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  }
  return true;
}

function rebuildWordsAll() {
  const all = [];
  for (let n = 1; n <= 50; n++) {
    const file = path.join(OUT_DIR, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    all.push(...loadJson(file).entries);
  }
  if (!dryRun) {
    fs.writeFileSync(
      path.join(OUT_DIR, "words-all.json"),
      JSON.stringify({ version: 1, entries: all }, null, 2) + "\n"
    );
  }
  return all.length;
}

function main() {
  if (dryRun) console.log("Dry run — no files written.\n");

  const map = buildLevelMap();
  const stats = { changes: [], unmatched: [] };

  for (let n = 1; n <= 50; n++) {
    if (!patchChunk(n, map, stats)) break;
  }

  const allCount = rebuildWordsAll();

  const dist = {};
  for (const c of stats.changes) dist[`${c.from}→${c.to}`] = (dist[`${c.from}→${c.to}`] ?? 0) + 1;

  console.log(`cefr_level changes: ${stats.changes.length}`);
  for (const [k, v] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
  if (stats.unmatched.length > 0) {
    console.log(`\nUnmatched (kept existing) ×${stats.unmatched.length}: ${stats.unmatched.join(", ")}`);
  } else {
    console.log("\nAll words matched a CEFR source.");
  }
  console.log(`words-all.json entries: ${allCount}`);
  console.log(dryRun ? "\nDry run done." : "\nDone.");
}

main();
