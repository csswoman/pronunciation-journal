/**
 * Generate extra example sentences for Essential Words entries.
 *
 * Writes to data/example-sentences.json (staging, committed and reviewable).
 * It does NOT touch the chunk files — run apply-example-sentences.mjs for that.
 *
 * Resumable: existing entries in the staging file are skipped, so an
 * interrupted run continues where it stopped and a re-run costs nothing.
 *
 * Usage:
 *   node scripts/essential-words/generate-example-sentences.mjs --limit 50
 *   node scripts/essential-words/generate-example-sentences.mjs --all
 *   node scripts/essential-words/generate-example-sentences.mjs --dry-run
 *
 * Run via `pnpm essential-words:gen-sentences` (invokes this through tsx,
 * since it imports lib/ai-prompts.ts directly — Node cannot import .ts files).
 *
 * Requires GEMINI_API_KEY in the environment.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { essentialWordSentencesPrompt } from "../../lib/ai-prompts.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const OUT_DIR = path.join(ROOT, "public/essential-words");
const STAGING = path.join(__dirname, "data/example-sentences.json");

const BATCH_SIZE = 20;
const PER_WORD = 2;
const MODEL = "gemini-2.5-flash-lite";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const all = args.includes("--all");
const limitArg = args.indexOf("--limit");
const limit = limitArg >= 0 ? Number(args[limitArg + 1]) : all ? Infinity : 20;

function loadStaging() {
  if (!fs.existsSync(STAGING)) return { version: 1, words: {} };
  return JSON.parse(fs.readFileSync(STAGING, "utf-8"));
}

function loadAllEntries() {
  const file = path.join(OUT_DIR, "words-all.json");
  return JSON.parse(fs.readFileSync(file, "utf-8")).entries;
}

async function generateBatch(ai, batch) {
  const prompt = essentialWordSentencesPrompt(batch, PER_WORD);
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  const parsed = JSON.parse(res.text);
  return parsed.words ?? {};
}

async function main() {
  const staging = loadStaging();
  const entries = loadAllEntries();
  const pending = entries
    .filter((e) => !staging.words[e.word.toLowerCase()])
    .slice(0, limit === Infinity ? undefined : limit);

  console.log(`${entries.length} entries total, ${pending.length} pending this run.`);
  if (dryRun) {
    console.log("Dry run — nothing generated.");
    return;
  }
  if (pending.length === 0) return;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const ai = new GoogleGenAI({ apiKey });

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    try {
      const result = await generateBatch(ai, batch);
      for (const [word, sentences] of Object.entries(result)) {
        if (!Array.isArray(sentences)) continue;
        staging.words[word.toLowerCase()] = sentences
          .filter((s) => typeof s === "string" && s.trim().length > 0)
          .map((s) => s.trim());
      }
      fs.writeFileSync(STAGING, JSON.stringify(staging, null, 2) + "\n");
      console.log(`Batch ${i / BATCH_SIZE + 1}: +${Object.keys(result).length} words`);
    } catch (err) {
      console.error(`Batch starting at ${i} failed: ${err.message}`);
    }
  }

  console.log(`\nStaged words: ${Object.keys(staging.words).length}`);
  console.log(`Review ${path.relative(ROOT, STAGING)}, then run apply-example-sentences.mjs.`);
}

main();
