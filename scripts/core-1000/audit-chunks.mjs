/**
 * Audit existing Core 1000 / NGSL chunks against CMU dictionary.
 * Reports IPA mismatches, missing words, and structural issues.
 * Does NOT modify any files.
 *
 * Usage:
 *   node scripts/core-1000/audit-chunks.mjs           # audit all chunks
 *   node scripts/core-1000/audit-chunks.mjs 11 16     # audit range
 *   node scripts/core-1000/audit-chunks.mjs --json    # output JSON report
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const ROOT = path.join(__dirname, "../..");

const ARPABET_TO_IPA = {
  AA: "ɑ", AE: "æ", AH: "ʌ", AO: "ɔ", AW: "aʊ", AY: "aɪ", EH: "ɛ", ER: "ɜr",
  EY: "eɪ", IH: "ɪ", IY: "iː", OW: "oʊ", OY: "ɔɪ", UH: "ʊ", UW: "uː",
  B: "b", CH: "tʃ", D: "d", DH: "ð", F: "f", G: "ɡ", HH: "h", JH: "dʒ",
  K: "k", L: "l", M: "m", N: "n", NG: "ŋ", P: "p", R: "ɹ", S: "s", SH: "ʃ",
  T: "t", TH: "θ", V: "v", W: "w", Y: "j", Z: "z", ZH: "ʒ",
};

const mod = require("cmu-pronouncing-dictionary");
const dict = mod.dictionary ?? mod.default ?? mod;

function stripStress(p) { return p.replace(/\d$/, ""); }

function lookupIpa(word) {
  const key = word.toLowerCase().replace(/[^a-z0-9']/g, "");
  if (!key) return null;
  const entry =
    dict[key] ??
    dict[key.replace(/-/g, "")] ??
    (key.endsWith("s") && key.length > 3 ? dict[key.slice(0, -1)] : undefined);
  if (!entry) return null;
  return "/" + entry.split(" ").map((p) => ARPABET_TO_IPA[stripStress(p)] ?? stripStress(p).toLowerCase()).join("") + "/";
}

function auditChunk(chunkNum) {
  const file = path.join(ROOT, "public/core-1000", `words-${String(chunkNum).padStart(3, "0")}.json`);
  if (!fs.existsSync(file)) return null;

  const { entries } = JSON.parse(fs.readFileSync(file, "utf-8"));
  const issues = [];

  if (entries.length !== 100) {
    issues.push({ type: "STRUCTURE", msg: `Expected 100 entries, got ${entries.length}` });
  }

  for (const entry of entries) {
    const { rank, word, ipa_strong, example_sentence, ipa_weak, sentence_ipa } = entry;

    // IPA format check
    if (!ipa_strong?.startsWith("/") || !ipa_strong?.endsWith("/")) {
      issues.push({ rank, word, type: "IPA_FORMAT", msg: `ipa_strong not wrapped in slashes: ${ipa_strong}` });
    }

    // CMU comparison
    const cmuIpa = lookupIpa(word);
    if (!cmuIpa) {
      issues.push({ rank, word, type: "NO_CMU", msg: `Word not in CMU dictionary` });
    } else if (cmuIpa !== ipa_strong) {
      issues.push({ rank, word, type: "IPA_DIFF", msg: `file: ${ipa_strong}  cmu: ${cmuIpa}` });
    }

    // sentence contains word
    const wordRegex = new RegExp(`\\b${word}\\b`, "i");
    if (!wordRegex.test(example_sentence)) {
      issues.push({ rank, word, type: "SENTENCE", msg: `Sentence doesn't contain base word: "${example_sentence}"` });
    }

    // ipa_weak requires sentence_ipa
    if (ipa_weak && !sentence_ipa) {
      issues.push({ rank, word, type: "MISSING_SENTENCE_IPA", msg: `ipa_weak present but no sentence_ipa` });
    }
  }

  return { chunkNum, file: path.basename(file), entries: entries.length, issues };
}

function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes("--json");
  const nums = args.filter((a) => !a.startsWith("--")).map(Number);
  const startChunk = nums[0] ?? 1;
  const endChunk = nums[1] ?? 28;

  const results = [];
  for (let c = startChunk; c <= endChunk; c++) {
    const result = auditChunk(c);
    if (result) results.push(result);
  }

  if (jsonMode) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  // Human-readable report
  let totalIssues = 0;
  for (const { chunkNum, file, issues } of results) {
    const ipaDiffs = issues.filter((i) => i.type === "IPA_DIFF");
    const other = issues.filter((i) => i.type !== "IPA_DIFF");

    if (issues.length === 0) {
      console.log(`✅ chunk ${chunkNum} (${file}) — no issues`);
      continue;
    }

    console.log(`\n⚠️  chunk ${chunkNum} (${file}) — ${issues.length} issue(s)`);
    for (const issue of other) {
      console.log(`  [${issue.type}] rank ${issue.rank} "${issue.word}": ${issue.msg}`);
    }
    if (ipaDiffs.length > 0) {
      console.log(`  [IPA_DIFF] ${ipaDiffs.length} words differ from CMU:`);
      for (const issue of ipaDiffs) {
        console.log(`    rank ${issue.rank} "${issue.word}": ${issue.msg}`);
      }
    }
    totalIssues += issues.length;
  }

  console.log(`\n--- ${results.length} chunks audited | ${totalIssues} total issues ---`);
  if (totalIssues > 0) {
    console.log("Note: IPA_DIFF is informational — CMU and the file may both be valid transcriptions.");
  }
}

main();
