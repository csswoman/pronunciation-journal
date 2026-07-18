/**
 * Backfill missing sentence_ipa for Core 1000 chunk files.
 *
 * - Only adds sentence_ipa when example_sentence exists and sentence_ipa is missing/empty
 * - Does NOT overwrite existing sentence_ipa
 * - Rebuilds words-all.json from contiguous words-NNN.json chunks
 *
 * Usage:
 *   node scripts/core-1000/backfill-sentence-ipa.mjs
 *   node scripts/core-1000/backfill-sentence-ipa.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { arpabetStringToIpa } from "../lib/arpabet-to-ipa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/core-1000");

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

const dryRun = process.argv.includes("--dry-run");

function lookupIpa(word) {
  const key = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!key) return null;
  const entry =
    dict[key] ??
    dict[key.replace(/-/g, "")] ??
    (key.endsWith("s") && key.length > 3 ? dict[key.slice(0, -1)] : undefined);
  if (!entry) return null;
  return `/${arpabetStringToIpa(entry)}/`;
}

function sentenceIpa(sentence, targetWord, weakIpa) {
  const tokens = sentence.match(/\b[\w']+\b/g) ?? [];
  const parts = tokens.map((tok) => {
    if (tok.toLowerCase() === targetWord.toLowerCase() && weakIpa) {
      return weakIpa.replace(/^\/|\/$/g, "");
    }
    const ipa = lookupIpa(tok);
    return ipa ? ipa.replace(/^\/|\/$/g, "") : tok.toLowerCase();
  });
  return `/${parts.join(" ")}/`;
}

function needsSentenceIpa(entry) {
  return (
    Boolean(entry.example_sentence?.trim()) &&
    (!entry.sentence_ipa || entry.sentence_ipa.trim() === "")
  );
}

function patchChunk(chunkNum) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return null;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  let filled = 0;

  for (const entry of data.entries) {
    if (!needsSentenceIpa(entry)) continue;
    entry.sentence_ipa = sentenceIpa(
      entry.example_sentence,
      entry.word,
      entry.ipa_weak ?? null
    );
    filled++;
  }

  if (!dryRun && filled > 0) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  }

  return { file, filled, count: data.entries.length };
}

function rebuildWordsAll() {
  const all = [];
  for (let n = 1; n <= 50; n++) {
    const file = path.join(OUT_DIR, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    const { entries } = JSON.parse(fs.readFileSync(file, "utf-8"));
    all.push(...entries);
  }
  const out = path.join(OUT_DIR, "words-all.json");
  if (!dryRun) {
    fs.writeFileSync(out, JSON.stringify({ version: 1, entries: all }, null, 2) + "\n");
  }
  return all.length;
}

function main() {
  console.log(dryRun ? "Dry run — no files written.\n" : "");

  let totalFilled = 0;
  for (let n = 1; n <= 50; n++) {
    const result = patchChunk(n);
    if (!result) break;
    totalFilled += result.filled;
    if (result.filled > 0) {
      console.log(
        `Chunk ${String(n).padStart(3, "0")}: sentence_ipa filled ×${result.filled}`
      );
    }
  }

  const allCount = rebuildWordsAll();
  console.log(`\nsentence_ipa filled: ${totalFilled}`);
  console.log(`words-all.json entries: ${allCount}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
