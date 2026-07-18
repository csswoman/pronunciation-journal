/**
 * Backfill per-word `meaning` (short EN definition) and `translation` (ES) for
 * Core 1000 / NGSL chunk files. The study card (lib/practice/study-card/model.ts)
 * already renders these; the Core-1000 data just never carried them, so beginners
 * saw a word + IPA + example but no meaning.
 *
 * Data sources (committed under data/):
 *   - meaning-es.json      word -> { meaning, translation } (lowest-CEFR sense).
 *       Derived from the Oxford 5000 dataset in github.com/Gamezxz/flashcard
 *       (data/vocabulary.json: `definition` for EN, `translations.es` for ES).
 *       Regenerate: re-download that file and keep, per word, the lowest-level
 *       sense's `definition` + word-level `translations.es`.
 *   - meaning-overrides.json  optional word -> { meaning?, translation? } for
 *       curated fixes / words absent from the source. Loaded only if present.
 *
 * Resolution per word/field: overrides -> meaning-es -> keep existing.
 * Only `meaning` / `translation` are touched. Rebuilds words-all.json.
 *
 * Usage:
 *   node scripts/core-1000/backfill-meaning.mjs            # apply
 *   node scripts/core-1000/backfill-meaning.mjs --dry-run  # report only
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/core-1000");
const DATA_DIR = path.join(__dirname, "data");

const dryRun = process.argv.includes("--dry-run");

function loadJson(file, fallback) {
  if (!fs.existsSync(file)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing required data file: ${file}`);
  }
  return JSON.parse(fs.readFileSync(file, "utf-8"));
}

function clean(value) {
  const t = typeof value === "string" ? value.trim() : "";
  return t.length > 0 ? t : null;
}

function buildMap() {
  const source = loadJson(path.join(DATA_DIR, "meaning-es.json")).words ?? {};
  const overrides = loadJson(path.join(DATA_DIR, "meaning-overrides.json"), {});
  const map = new Map();
  for (const [word, rec] of Object.entries(source)) {
    map.set(word.toLowerCase(), {
      meaning: clean(rec.meaning),
      translation: clean(rec.translation),
    });
  }
  for (const [word, rec] of Object.entries(overrides)) {
    if (word.startsWith("_")) continue;
    const prev = map.get(word.toLowerCase()) ?? { meaning: null, translation: null };
    map.set(word.toLowerCase(), {
      meaning: clean(rec.meaning) ?? prev.meaning,
      translation: clean(rec.translation) ?? prev.translation,
    });
  }
  return map;
}

function patchChunk(chunkNum, map, stats) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return false;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  let changed = 0;

  for (const entry of data.entries) {
    const rec = map.get(entry.word.toLowerCase());
    const meaning = rec?.meaning ?? clean(entry.meaning);
    const translation = rec?.translation ?? clean(entry.translation);

    if (!rec?.meaning && !rec?.translation && !clean(entry.meaning) && !clean(entry.translation)) {
      stats.unmatched.push(`${entry.rank}:${entry.word}`);
    }

    let touched = false;
    if (meaning && meaning !== entry.meaning) {
      entry.meaning = meaning;
      touched = true;
    }
    if (translation && translation !== entry.translation) {
      entry.translation = translation;
      touched = true;
    }
    if (touched) changed++;
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
    all.push(...JSON.parse(fs.readFileSync(file, "utf-8")).entries);
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

  const map = buildMap();
  const stats = { unmatched: [] };
  let touchedChunks = 0;
  for (let n = 1; n <= 50; n++) {
    if (!patchChunk(n, map, stats)) break;
    touchedChunks++;
  }

  const allCount = rebuildWordsAll();
  const withMeaning = [];
  const withTranslation = [];
  for (let n = 1; n <= touchedChunks; n++) {
    const file = path.join(OUT_DIR, `words-${String(n).padStart(3, "0")}.json`);
    for (const e of JSON.parse(fs.readFileSync(file, "utf-8")).entries) {
      if (clean(e.meaning)) withMeaning.push(e.word);
      if (clean(e.translation)) withTranslation.push(e.word);
    }
  }

  console.log(`meaning present: ${withMeaning.length}/${allCount}`);
  console.log(`translation present: ${withTranslation.length}/${allCount}`);
  if (stats.unmatched.length > 0) {
    console.log(`\nNo meaning/translation (${stats.unmatched.length}): ${stats.unmatched.join(", ")}`);
  } else {
    console.log("\nAll words have meaning and/or translation.");
  }
  console.log(`words-all.json entries: ${allCount}`);
  console.log(dryRun ? "\nDry run done." : "\nDone.");
}

main();
