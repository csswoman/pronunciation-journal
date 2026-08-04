/**
 * Apply staged example sentences (data/example-sentences.json) to the chunk
 * files as `example_sentences[]`, computing sentence_ipa for each variant with
 * the same CMU pipeline as backfill-sentence-ipa.mjs.
 *
 * Skips any variant that:
 *   - does not contain the target word,
 *   - duplicates the base sentence or an earlier variant,
 *   - is shorter than 4 tokens (no context for cloze).
 *
 * Idempotent: rewrites example_sentences from staging every run, so fixing the
 * staging file and re-running converges. Rebuilds words-all.json.
 *
 * Usage:
 *   node scripts/essential-words/apply-example-sentences.mjs
 *   node scripts/essential-words/apply-example-sentences.mjs --dry-run
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { arpabetStringToIpa } from "../lib/arpabet-to-ipa.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");
const STAGING = path.join(__dirname, "data/example-sentences.json");

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

const dryRun = process.argv.includes("--dry-run");
const MIN_TOKENS = 4;

function lookupIpa(word) {
  const key = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!key) return null;
  const entry =
    dict[key] ??
    dict[key.replace(/-/g, "")] ??
    (key.endsWith("s") && key.length > 3 ? dict[key.slice(0, -1)] : undefined);
  return entry ? `/${arpabetStringToIpa(entry)}/` : null;
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

function containsWord(sentence, word) {
  const w = word.toLowerCase();
  const tokens = sentence.toLowerCase().match(/\b[\w']+\b/g) ?? [];
  return tokens.some(
    (t) =>
      t === w ||
      t === `${w}s` ||
      t === `${w}es` ||
      t === `${w}d` ||
      t === `${w}ed` ||
      t === `${w}ing` ||
      (w.endsWith("e") && t === `${w.slice(0, -1)}ing`)
  );
}

function acceptable(sentence, word, seen) {
  const text = sentence.trim();
  if ((text.match(/\b[\w']+\b/g) ?? []).length < MIN_TOKENS) return false;
  if (!containsWord(text, word)) return false;
  if (seen.has(text.toLowerCase())) return false;
  return true;
}

function patchChunk(chunkNum, staged, stats) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return false;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  let changed = 0;

  for (const entry of data.entries) {
    const candidates = staged[entry.word.toLowerCase()];
    if (!candidates || candidates.length === 0) continue;

    const seen = new Set([entry.example_sentence.trim().toLowerCase()]);
    const variants = [];
    for (const sentence of candidates) {
      const text = sentence.trim();
      if (!acceptable(text, entry.word, seen)) {
        stats.rejected.push(`${entry.word}: "${text}"`);
        continue;
      }
      seen.add(text.toLowerCase());
      variants.push({
        sentence: text,
        sentence_ipa: sentenceIpa(text, entry.word, entry.ipa_weak ?? null),
      });
    }

    if (variants.length > 0) {
      entry.example_sentences = variants;
      changed++;
      stats.accepted += variants.length;
    } else {
      delete entry.example_sentences;
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
  if (!fs.existsSync(STAGING)) throw new Error(`Missing staging file: ${STAGING}`);

  const staged = JSON.parse(fs.readFileSync(STAGING, "utf-8")).words ?? {};
  const stats = { accepted: 0, rejected: [] };

  for (let n = 1; n <= 50; n++) {
    if (!patchChunk(n, staged, stats)) break;
  }

  const allCount = rebuildWordsAll();
  console.log(`variants applied: ${stats.accepted}`);
  console.log(`variants rejected: ${stats.rejected.length}`);
  if (stats.rejected.length > 0) {
    console.log(`\nRejected:\n${stats.rejected.slice(0, 40).join("\n")}`);
    if (stats.rejected.length > 40) console.log(`… and ${stats.rejected.length - 40} more`);
  }
  console.log(`\nwords-all.json entries: ${allCount}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
