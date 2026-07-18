/**
 * Patch Core 1000 chunks with lexical stress from CMU.
 *
 * - ipa_strong: rebuilt from CMU (unless word is in ipa-exceptions.json)
 * - sentence_ipa: rebuilt with stressed lookup + weak override when the
 *   existing transcription has no ˈ/ˌ (preserves hand-crafted stressed IPA)
 * - Rebuilds words-all.json from contiguous chunks
 *
 * Usage:
 *   node scripts/core-1000/apply-lexical-stress.mjs
 *   node scripts/core-1000/apply-lexical-stress.mjs --dry-run
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
const EXCEPTIONS_PATH = path.join(__dirname, "data/ipa-exceptions.json");

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

function hasStressMark(ipa) {
  return /[ˈˌ]/.test(ipa);
}

function loadExceptions() {
  const raw = JSON.parse(fs.readFileSync(EXCEPTIONS_PATH, "utf-8"));
  return new Set(
    Object.keys(raw).filter((k) => !k.startsWith("_"))
  );
}

function patchChunk(chunkNum, exceptions) {
  const file = path.join(OUT_DIR, `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return null;

  const data = JSON.parse(fs.readFileSync(file, "utf-8"));
  let strongUpdated = 0;
  let sentenceUpdated = 0;

  for (const entry of data.entries) {
    const cmu = lookupIpa(entry.word);
    if (cmu && !exceptions.has(entry.word) && entry.ipa_strong !== cmu) {
      entry.ipa_strong = cmu;
      strongUpdated++;
    }

    if (entry.sentence_ipa && !hasStressMark(entry.sentence_ipa)) {
      const next = sentenceIpa(
        entry.example_sentence,
        entry.word,
        entry.ipa_weak ?? null
      );
      if (next !== entry.sentence_ipa) {
        entry.sentence_ipa = next;
        sentenceUpdated++;
      }
    }
  }

  if (!dryRun) {
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  }

  return { file, strongUpdated, sentenceUpdated, count: data.entries.length };
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
  const exceptions = loadExceptions();
  console.log(`Exceptions preserved: ${exceptions.size}`);
  console.log(dryRun ? "Dry run — no files written.\n" : "");

  let totalStrong = 0;
  let totalSentence = 0;
  for (let n = 1; n <= 50; n++) {
    const result = patchChunk(n, exceptions);
    if (!result) break;
    totalStrong += result.strongUpdated;
    totalSentence += result.sentenceUpdated;
    console.log(
      `Chunk ${String(n).padStart(3, "0")}: ` +
        `ipa_strong×${result.strongUpdated}, sentence_ipa×${result.sentenceUpdated}`
    );
  }

  const allCount = rebuildWordsAll();
  console.log(`\nipa_strong updated: ${totalStrong}`);
  console.log(`sentence_ipa updated: ${totalSentence}`);
  console.log(`words-all.json entries: ${allCount}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
