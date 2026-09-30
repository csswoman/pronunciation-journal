/**
 * Validates the generated CEFR resource packs (Plan 057, Step 1).
 * Run after `pnpm offline-packs:generate`: `pnpm validate:offline-packs`.
 *
 * Checks:
 *  - each level's unique word count matches EXPECTED_UNIQUE_WORD_COUNTS exactly;
 *  - no word appears twice within a pack, or across packs;
 *  - sum across all packs = EXPECTED_TOTAL_UNIQUE_WORDS;
 *  - every required resource URL (essential-words, grammar-deck, audio) exists on disk;
 *  - manifest.contentVersion matches every level entry's contentVersion and the
 *    generated essential-words.json's own contentVersion.
 * Exits non-zero with a clear message on the first category of failure it finds.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  EXPECTED_TOTAL_UNIQUE_WORDS,
  EXPECTED_UNIQUE_WORD_COUNTS,
  OFFLINE_PACK_LEVELS,
} from "../../lib/offline/pack-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT, "public");
const MANIFEST_FILE = path.join(PUBLIC_DIR, "offline-packs", "manifest.json");

function fail(message) {
  console.error(`[offline-packs:validate] FAIL: ${message}`);
  process.exitCode = 1;
}

function resolveUrl(url) {
  // Manifest URLs are site-relative ("/offline-packs/...", "/grammar-decks/...", "/sounds/...").
  return path.join(PUBLIC_DIR, decodeURIComponent(url).replace(/^\//, ""));
}

function main() {
  if (!fs.existsSync(MANIFEST_FILE)) {
    fail(`manifest not found at ${MANIFEST_FILE} — run \`pnpm offline-packs:generate\` first.`);
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf-8"));

  const missingLevels = OFFLINE_PACK_LEVELS.filter(
    (level) => !manifest.levels.some((entry) => entry.level === level)
  );
  if (missingLevels.length > 0) {
    fail(`manifest is missing level(s): ${missingLevels.join(", ")}`);
    return;
  }

  const wordsSeenGlobally = new Map(); // word -> level it was first seen in
  let totalUnique = 0;
  let anyStructuralFailure = false;

  for (const entry of manifest.levels) {
    if (entry.contentVersion !== manifest.contentVersion) {
      fail(
        `level ${entry.level} contentVersion "${entry.contentVersion}" does not match manifest contentVersion "${manifest.contentVersion}"`
      );
      anyStructuralFailure = true;
    }

    for (const resource of [...entry.required, ...entry.optional]) {
      if (resource.kind === "coach-content-bank") continue; // no on-disk file yet (Step 3)
      const filePath = resolveUrl(resource.url);
      if (!fs.existsSync(filePath)) {
        fail(`level ${entry.level}: resource "${resource.url}" (kind ${resource.kind}) does not exist on disk`);
        anyStructuralFailure = true;
      }
    }

    const essentialWords = entry.required.find((r) => r.kind === "essential-words");
    if (!essentialWords) {
      fail(`level ${entry.level}: manifest has no essential-words resource in "required"`);
      anyStructuralFailure = true;
      continue;
    }

    const filePath = resolveUrl(essentialWords.url);
    if (!fs.existsSync(filePath)) continue; // already reported above

    const packFile = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (packFile.contentVersion !== manifest.contentVersion) {
      fail(
        `${essentialWords.url}: file contentVersion "${packFile.contentVersion}" does not match manifest contentVersion "${manifest.contentVersion}"`
      );
      anyStructuralFailure = true;
    }

    const words = packFile.entries.map((e) => e.word);
    const uniqueWithinPack = new Set(words);
    if (uniqueWithinPack.size !== words.length) {
      fail(`level ${entry.level}: essential-words.json has duplicate words within the pack itself`);
      anyStructuralFailure = true;
    }

    const expected = EXPECTED_UNIQUE_WORD_COUNTS[entry.level];
    if (uniqueWithinPack.size !== expected) {
      fail(`level ${entry.level}: ${uniqueWithinPack.size} unique words, expected ${expected}`);
      anyStructuralFailure = true;
    }
    if (essentialWords.wordCount !== uniqueWithinPack.size) {
      fail(
        `level ${entry.level}: manifest wordCount ${essentialWords.wordCount} does not match file's actual ${uniqueWithinPack.size}`
      );
      anyStructuralFailure = true;
    }

    for (const word of uniqueWithinPack) {
      const seenInLevel = wordsSeenGlobally.get(word);
      if (seenInLevel) {
        fail(`word "${word}" appears in both level ${seenInLevel} and level ${entry.level}`);
        anyStructuralFailure = true;
      } else {
        wordsSeenGlobally.set(word, entry.level);
      }
    }
    totalUnique += uniqueWithinPack.size;
  }

  if (!anyStructuralFailure && totalUnique !== EXPECTED_TOTAL_UNIQUE_WORDS) {
    fail(`total unique words across all packs is ${totalUnique}, expected ${EXPECTED_TOTAL_UNIQUE_WORDS}`);
  }

  if (process.exitCode) {
    console.error("[offline-packs:validate] one or more checks failed — see above.");
  } else {
    console.log(
      `[offline-packs:validate] OK — ${totalUnique} unique words across ${manifest.levels.length} packs, contentVersion ${manifest.contentVersion}`
    );
  }
}

main();
