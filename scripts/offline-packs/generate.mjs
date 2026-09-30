/**
 * Generates the downloadable CEFR resource packs (Plan 057, Step 1):
 *
 *   public/offline-packs/<contentVersion>/<level>/essential-words.json   (A1..C1)
 *   public/offline-packs/manifest.json
 *
 * Run: `pnpm offline-packs:generate` (invokes this file via tsx so it can
 * import the same TypeScript modules the app uses — see
 * scripts/audit-learning-loop.mjs for the same pattern).
 *
 * Source of truth for words: the 28 canonical `public/essential-words/words-NNN.json`
 * chunks (never `words-all.json`). Source of truth for grammar deck slugs per
 * level: the canonical curriculum route (`getLevelById` in
 * lib/courses/curriculumIndex.ts), never filename-prefix guessing.
 *
 * Deduplication note (read before touching the dedupe logic below): three
 * words — "difficulty" (B1), "purchase" (B2), "fortunate" (B2) — are authored
 * twice across the chunks. They agree on every *identity* field (word, pos,
 * ipa_strong, ipa_weak, cefr_level, meaning, translation, teachWith, study)
 * but disagree on *content* fields (rank, example_sentence, sentence_ipa,
 * example_tokens, example_sentences) — i.e. they are near-duplicates with a
 * different authored example sentence, not byte-identical copies. Dedup
 * keeps the lower-rank (first-encountered) occurrence's content fields and
 * throws only when an identity field disagrees, since that would mean the
 * two rows describe different words that happen to collide.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getLevelById } from "../../lib/courses/curriculumIndex.ts";
import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from "../../lib/pronunciation/ipa-audio.ts";
import {
  EXPECTED_TOTAL_UNIQUE_WORDS,
  EXPECTED_UNIQUE_WORD_COUNTS,
  OFFLINE_PACK_CONTENT_VERSION,
  OFFLINE_PACK_LEVELS,
  OFFLINE_PACK_SCHEMA_VERSION,
} from "../../lib/offline/pack-types.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");
const WORDS_DIR = path.join(ROOT, "public", "essential-words");
const DECKS_DIR = path.join(ROOT, "public", "grammar-decks");
const SOUNDS_DIR = path.join(ROOT, "public", "sounds");
const OUT_ROOT = path.join(ROOT, "public", "offline-packs");

const IDENTITY_FIELDS = [
  "word",
  "pos",
  "ipa_strong",
  "ipa_weak",
  "cefr_level",
  "meaning",
  "translation",
  "teachWith",
  "study",
];

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  if (aKeys.length !== bKeys.length || aKeys.some((k, i) => k !== bKeys[i])) return false;
  return aKeys.every((k) => deepEqual(a[k], b[k]));
}

/** Reads words-001.json.. in order, stopping at the first missing chunk (canonical MAX_CHUNKS = 28). */
function readCanonicalChunks() {
  const entries = [];
  for (let n = 1; ; n++) {
    const file = path.join(WORDS_DIR, `words-${String(n).padStart(3, "0")}.json`);
    if (!fs.existsSync(file)) break;
    const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
    for (const entry of parsed.entries ?? []) entries.push({ entry, file });
  }
  if (entries.length === 0) {
    throw new Error("[offline-packs] no words-NNN.json chunks found under public/essential-words");
  }
  return entries;
}

/** Dedupes by `word`. Throws (STOP condition) if two rows for the same word disagree on an identity field. */
function dedupeByWord(chunkEntries) {
  const byWord = new Map();
  for (const { entry, file } of chunkEntries) {
    const existing = byWord.get(entry.word);
    if (!existing) {
      byWord.set(entry.word, { entry, file });
      continue;
    }
    const mismatched = IDENTITY_FIELDS.filter((f) => !deepEqual(existing.entry[f], entry[f]));
    if (mismatched.length > 0) {
      throw new Error(
        `[offline-packs] STOP: duplicate word "${entry.word}" disagrees on identity field(s) ` +
          `${mismatched.join(", ")} between ${existing.file} and ${file}. Resolve the authored ` +
          `data before regenerating — this must not be silently resolved.`
      );
    }
    // Identity agrees; keep the first-encountered (lower rank) row's content fields.
  }
  return [...byWord.values()].map(({ entry }) => entry);
}

function groupByLevel(uniqueEntries) {
  const byLevel = new Map(OFFLINE_PACK_LEVELS.map((level) => [level, []]));
  for (const entry of uniqueEntries) {
    const bucket = byLevel.get(entry.cefr_level);
    if (!bucket) {
      throw new Error(
        `[offline-packs] STOP: word "${entry.word}" has cefr_level "${entry.cefr_level}", ` +
          `which has no offline pack (only ${OFFLINE_PACK_LEVELS.join(", ")} are packaged).`
      );
    }
    bucket.push(entry);
  }
  for (const bucket of byLevel.values()) bucket.sort((a, b) => a.rank - b.rank);
  return byLevel;
}

/**
 * Grammar deck lessons for a level, from the canonical curriculum route —
 * never filename guessing. Keeps the first lesson per slug (its title and
 * number are what the offline hub shows and credits progress against).
 */
function grammarDeckLessonsForLevel(level) {
  const trackId = level.toLowerCase();
  const coursePathLevel = getLevelById(trackId);
  if (!coursePathLevel) {
    throw new Error(`[offline-packs] STOP: no curriculum level found for trackId "${trackId}"`);
  }
  const bySlug = new Map();
  for (const unit of coursePathLevel.units) {
    for (const lesson of unit.lessons) {
      if (lesson.slug && !bySlug.has(lesson.slug)) {
        bySlug.set(lesson.slug, { slug: lesson.slug, title: lesson.title, lessonNumber: lesson.number });
      }
    }
  }
  return [...bySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug));
}

function readGrammarDeck(slug) {
  const file = path.join(DECKS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    throw new Error(
      `[offline-packs] STOP: curriculum lesson references grammar deck slug "${slug}" but ` +
        `public/grammar-decks/${slug}.json does not exist.`
    );
  }
  return { file, deck: JSON.parse(fs.readFileSync(file, "utf-8")) };
}

/**
 * IPA symbols a deck references as *bare* symbols (deck.sounds, or a
 * pronunciation block whose `sound` is itself a bare symbol found in
 * IPA_AUDIO_MAP) — mirrors lib/offline/download-manager.ts's
 * extractAudioUrlsFromDeck, which only resolves audio this way (a block
 * `sound` like "/ɪ/ vs /iː/" has no map entry and yields no audio).
 */
function audioSymbolsForDeck(deck) {
  const symbols = new Set();
  for (const s of deck.sounds ?? []) {
    if (IPA_AUDIO_MAP[s]) symbols.add(s);
  }
  for (const card of deck.cards ?? []) {
    for (const block of card.blocks ?? []) {
      if (block.type === "pronunciation" && IPA_AUDIO_MAP[block.sound]) {
        symbols.add(block.sound);
      }
    }
  }
  return symbols;
}

function bytesOf(file) {
  return fs.statSync(file).size;
}

function buildEssentialWordsResource(level, entries) {
  const dir = path.join(OUT_ROOT, OFFLINE_PACK_CONTENT_VERSION, level);
  fs.mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, "essential-words.json");
  const payload = {
    schemaVersion: OFFLINE_PACK_SCHEMA_VERSION,
    contentVersion: OFFLINE_PACK_CONTENT_VERSION,
    level,
    entries,
  };
  fs.writeFileSync(outFile, `${JSON.stringify(payload)}\n`);
  return {
    kind: "essential-words",
    url: `/offline-packs/${OFFLINE_PACK_CONTENT_VERSION}/${level}/essential-words.json`,
    estimatedBytes: bytesOf(outFile),
    wordCount: entries.length,
  };
}

function buildLevelManifestEntry(level, entries) {
  const essentialWords = buildEssentialWordsResource(level, entries);

  const lessons = grammarDeckLessonsForLevel(level);
  const grammarResources = [];
  const audioSymbols = new Set();
  for (const { slug, title, lessonNumber } of lessons) {
    const { file, deck } = readGrammarDeck(slug);
    grammarResources.push({
      kind: "grammar-deck",
      slug,
      title,
      lessonNumber,
      url: `/grammar-decks/${slug}.json`,
      estimatedBytes: bytesOf(file),
    });
    for (const symbol of audioSymbolsForDeck(deck)) audioSymbols.add(symbol);
  }

  const audioResources = [...audioSymbols].sort().map((symbol) => {
    const filename = IPA_AUDIO_MAP[symbol];
    const file = path.join(SOUNDS_DIR, filename);
    if (!fs.existsSync(file)) {
      throw new Error(
        `[offline-packs] STOP: IPA_AUDIO_MAP["${symbol}"] = "${filename}" but public/sounds/${filename} does not exist.`
      );
    }
    return {
      kind: "audio",
      ipaSymbol: symbol,
      url: `${SOUNDS_BASE_URL}/${encodeURIComponent(filename)}`,
      estimatedBytes: bytesOf(file),
    };
  });

  const required = [essentialWords, ...grammarResources, ...audioResources];
  const estimatedBytes = required.reduce((sum, r) => sum + r.estimatedBytes, 0);

  return {
    schemaVersion: OFFLINE_PACK_SCHEMA_VERSION,
    contentVersion: OFFLINE_PACK_CONTENT_VERSION,
    level,
    estimatedBytes,
    required,
    // Coach content-bank slice is downloaded live per device in Step 3 — no
    // generated file exists yet, so nothing is listed here today.
    optional: [],
  };
}

function main() {
  const chunkEntries = readCanonicalChunks();
  const uniqueEntries = dedupeByWord(chunkEntries);

  if (uniqueEntries.length !== EXPECTED_TOTAL_UNIQUE_WORDS) {
    throw new Error(
      `[offline-packs] STOP: expected ${EXPECTED_TOTAL_UNIQUE_WORDS} unique words, got ${uniqueEntries.length}.`
    );
  }

  const byLevel = groupByLevel(uniqueEntries);
  for (const level of OFFLINE_PACK_LEVELS) {
    const count = byLevel.get(level).length;
    const expected = EXPECTED_UNIQUE_WORD_COUNTS[level];
    if (count !== expected) {
      throw new Error(`[offline-packs] STOP: level ${level} has ${count} unique words, expected ${expected}.`);
    }
  }

  fs.mkdirSync(OUT_ROOT, { recursive: true });

  const levels = OFFLINE_PACK_LEVELS.map((level) => buildLevelManifestEntry(level, byLevel.get(level)));

  const manifest = {
    schemaVersion: OFFLINE_PACK_SCHEMA_VERSION,
    contentVersion: OFFLINE_PACK_CONTENT_VERSION,
    generatedAt: new Date().toISOString(),
    levels,
  };
  fs.writeFileSync(path.join(OUT_ROOT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(`[offline-packs] contentVersion ${OFFLINE_PACK_CONTENT_VERSION}`);
  for (const entry of levels) {
    const words = entry.required.find((r) => r.kind === "essential-words").wordCount;
    const decks = entry.required.filter((r) => r.kind === "grammar-deck").length;
    const audio = entry.required.filter((r) => r.kind === "audio").length;
    const kb = (entry.estimatedBytes / 1024).toFixed(1);
    console.log(`  ${entry.level}: ${words} words, ${decks} decks, ${audio} audio clips, ${kb} KB`);
  }
  console.log(`[offline-packs] wrote manifest.json + ${levels.length} essential-words.json files`);
}

main();
