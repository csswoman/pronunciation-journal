/**
 * One-off fix for Essential Words Fase 0 (see
 * docs/superpowers/specs/2026-08-04-essential-words-learning-sessions-design.md §5).
 *
 * `high` and `offer` are the only 2 of 2800 entries with no cloze-viable sentence
 * in any existing variant. This adds one new variant to each, computes its
 * sentence_ipa with the same CMU-dictionary pipeline apply-example-sentences.mjs
 * uses, and rebuilds words-all.json.
 *
 * Not meant to be reused — the two sentences are hardcoded because this fixes
 * exactly these two hand-picked entries. Delete this file after running it once.
 *
 * Usage:
 *   node scripts/essential-words/fix-phase0-cloze.mjs --dry-run
 *   node scripts/essential-words/fix-phase0-cloze.mjs
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

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

const dryRun = process.argv.includes("--dry-run");

const FIXES = [
  { chunk: "words-002.json", word: "high", sentence: "The wall in the garden is very high." },
  { chunk: "words-003.json", word: "offer", sentence: "They offer free coffee every morning." },
];

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
      JSON.stringify({ version: 1, entries: all }, null, 2) + "\n",
    );
  }
  return all.length;
}

function main() {
  if (dryRun) console.log("Dry run — no files written.\n");

  for (const fix of FIXES) {
    const file = path.join(OUT_DIR, fix.chunk);
    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    const entry = data.entries.find((e) => e.word === fix.word);
    if (!entry) throw new Error(`${fix.word} not found in ${fix.chunk}`);

    const variant = {
      sentence: fix.sentence,
      sentence_ipa: sentenceIpa(fix.sentence, entry.word, entry.ipa_weak ?? null),
    };
    entry.example_sentences = [...(entry.example_sentences ?? []), variant];

    console.log(`${fix.word}: +"${variant.sentence}" [${variant.sentence_ipa}]`);

    if (!dryRun) {
      fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
    }
  }

  const count = rebuildWordsAll();
  console.log(`\nwords-all.json entries: ${count}`);
  console.log(dryRun ? "Dry run done." : "Done.");
}

main();
