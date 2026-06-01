#!/usr/bin/env node
/**
 * Enrich public/lexicon/*.json with ipa (CMU + dictionary API) and translation (Gemini).
 *
 * Usage:
 *   node scripts/enrich-lexicon.mjs --ipa          # IPA only (no API key)
 *   node scripts/enrich-lexicon.mjs --translation  # Spanish glosses (needs GEMINI_API_KEY)
 *   node scripts/enrich-lexicon.mjs --all          # both
 *   node scripts/enrich-lexicon.mjs --all --dry-run
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEXICON_DIR = path.join(__dirname, "..", "public", "lexicon");

const ARPABET_TO_IPA = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɜr",
  EY: "eɪ", IH: "ɪ", IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "uː",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ",
  K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "ɹ", S: "s",
  SH: "ʃ", T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

const dict = require("cmu-pronouncing-dictionary");
const CMU = dict.dictionary ?? dict.default ?? dict;

function stripStress(p) {
  return p.replace(/\d$/, "");
}

function arpabetToIpa(arpabet) {
  return arpabet
    .split(" ")
    .map((ph) => ARPABET_TO_IPA[stripStress(ph)] ?? stripStress(ph).toLowerCase())
    .join("");
}

function lookupCmu(word) {
  const tokens = word.trim().split(/[\s/]+/).filter(Boolean);
  const parts = [];
  for (const raw of tokens) {
    const key = raw.toLowerCase().replace(/[^a-z0-9']/g, "");
    if (!key) continue;
    const entry =
      CMU[key] ??
      CMU[key.replace(/-/g, "")] ??
      (key.endsWith("s") && key.length > 3 ? CMU[key.slice(0, -1)] : undefined);
    if (!entry) return null;
    parts.push(arpabetToIpa(entry));
  }
  return parts.length ? `/${parts.join(" ")}/` : null;
}

async function fetchDictionaryIpa(word) {
  const slug = encodeURIComponent(word.trim().toLowerCase());
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${slug}`);
    if (!res.ok) return null;
    const data = await res.json();
    const text =
      data[0]?.phonetics?.find((p) => p.text)?.text ?? data[0]?.phonetic ?? "";
    return text?.trim() || null;
  } catch {
    return null;
  }
}

async function resolveIpa(word, existing) {
  if (existing?.trim()) return existing.trim();
  const cmu = lookupCmu(word);
  if (cmu) return cmu;
  await sleep(120);
  return (await fetchDictionaryIpa(word)) ?? "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(items) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY required for --translation");
    process.exit(1);
  }

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const payload = items.map((w) => ({
    id: w.id,
    word: w.word,
    definition: w.definition,
  }));

  const prompt = `You help Spanish speakers learn English technical vocabulary.
For each item return a short Spanish gloss (1–6 words), natural for flashcards — not a full dictionary entry.

Return ONLY a JSON array: [{"id":"...","translation":"..."}, ...]

Items:
${JSON.stringify(payload, null, 0)}`;

  let res;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      res = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: prompt,
        config: { responseMimeType: "application/json" },
      });
      break;
    } catch (err) {
      const status = err?.status ?? err?.error?.code;
      if (status === 429 && attempt < 4) {
        const wait = 35_000 * (attempt + 1);
        console.warn(`  rate limited — waiting ${wait / 1000}s…`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }

  const text = res.text?.trim() ?? "[]";
  const parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  if (!Array.isArray(parsed)) throw new Error("Expected JSON array from Gemini");
  return parsed;
}

function listCategoryFiles() {
  return fs
    .readdirSync(LEXICON_DIR)
    .filter((f) => f.endsWith(".json") && f !== "index.json")
    .map((f) => path.join(LEXICON_DIR, f));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const doIpa = args.has("--ipa") || args.has("--all");
  const doTranslation = args.has("--translation") || args.has("--all");
  const dryRun = args.has("--dry-run");

  if (!doIpa && !doTranslation) {
    console.log("Pass --ipa, --translation, or --all");
    process.exit(1);
  }

  const files = listCategoryFiles();
  let ipaAdded = 0;
  let ipaMissing = 0;
  let transAdded = 0;

  for (const filePath of files) {
    const words = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let changed = false;

    if (doIpa) {
      for (const w of words) {
        if (w.ipa?.trim()) continue;
        const ipa = await resolveIpa(w.word, w.ipa);
        if (ipa) {
          w.ipa = ipa;
          ipaAdded++;
          changed = true;
        } else {
          ipaMissing++;
          console.warn(`  [ipa] missing: ${w.word} (${path.basename(filePath)})`);
        }
      }
    }

    if (doTranslation) {
      const needs = words.filter((w) => !w.translation?.trim());
      if (needs.length === 0) continue;
      const BATCH = 25;
      for (let i = 0; i < needs.length; i += BATCH) {
        const batch = needs.slice(i, i + BATCH);
        if (batch.length === 0) continue;
        console.log(`  translating ${path.basename(filePath)} ${i + 1}-${i + batch.length}/${needs.length}`);
        const results = await translateBatch(batch);
        const byId = new Map(results.map((r) => [r.id, r.translation]));
        for (const w of batch) {
          const t = byId.get(w.id);
          if (t?.trim()) {
            w.translation = t.trim();
            transAdded++;
            changed = true;
          }
        }
        await sleep(6500);
      }
    }

    if (changed && !dryRun) {
      fs.writeFileSync(filePath, `${JSON.stringify(words, null, 2)}\n`);
      console.log(`✔ ${path.basename(filePath)}`);
    }
  }

  console.log(
    `\nDone. IPA added: ${ipaAdded}, IPA missing: ${ipaMissing}, translations added: ${transAdded}${dryRun ? " (dry run)" : ""}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
