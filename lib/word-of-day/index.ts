import {
  selectDictionarySense,
  type DictionaryMeaning,
} from "@/lib/word-of-day/select-sense";
import { FALLBACK_DEFINITIONS } from "@/lib/word-of-day/definitions-fallback";

export {
  selectDictionarySense,
  type SelectedDictionarySense,
} from "@/lib/word-of-day/select-sense";

export interface WordOfDay {
  word: string;
  ipa: string;
  part_of_speech?: string;
  definition: string;
  example_sentence: string;
  difficulty: "beginner" | "intermediate" | "advanced";
}

const DICTIONARY_TIMEOUT_MS = 4_000;

const WORD_LIST = [
  "ambiguous", "resilient", "eloquent", "meticulous", "benevolent",
  "ephemeral", "tenacious", "lucid", "pragmatic", "whimsical",
  "melancholy", "vivid", "serendipity", "aberrant", "candid",
  "diligent", "empathy", "facetious", "gregarious", "harbinger",
  "idyllic", "jubilant", "kinetic", "languid", "magnanimous",
  "nostalgia", "obstinate", "pensive", "querulous", "reverence",
  "stoic", "taciturn", "ubiquitous", "verbose", "wistful",
  "zealous", "aloof", "blithe", "candor", "dauntless",
  "eccentric", "fervent", "guileless", "hapless", "impetuous",
  "jovial", "keen", "loquacious", "mellow", "nonchalant",
  "opulent", "placid", "quaint", "radiant", "serene",
  "tenuous", "urbane", "vivacious", "whimsy", "xenial",
  "yearning", "zeal", "ardent", "bliss", "clarity",
  "deft", "elusive", "flair", "gracious", "humble",
  "inquisitive", "jovial", "keen", "lucid", "muse",
  "nimble", "overt", "poise", "quell", "robust",
  "steadfast", "tranquil", "upbeat", "valor", "witty",
  "astute", "buoyant", "compassion", "discern", "enigma",
  "flourish", "grit", "harmony", "integrity", "joyful",
  "kindle", "linger", "mindful", "nuance", "optimism",
  "persevere", "quest", "radiance", "solace", "thrive",
  "unravel", "venture", "wisdom", "yearn", "zest",
  "amiable", "brevity", "courageous", "devoted", "earnest",
  "forthright", "generous", "heartfelt", "innocent", "jubilee",
  "knack", "lavish", "meander", "nurture", "outgoing",
  "patience", "quirky", "resolute", "sincere", "thoughtful",
  "uplifting", "vibrant", "warmth", "exquisite", "youthful",
] as const;

const ADVANCED_WORDS = new Set([
  "aberrant", "querulous", "taciturn", "languid", "magnanimous",
  "guileless", "impetuous", "loquacious", "hapless", "nonchalant",
  "opulent", "facetious", "gregarious", "harbinger", "obstinate",
  "ephemeral", "meticulous", "eloquent", "serendipity", "ubiquitous",
]);

const BEGINNER_WORDS = new Set([
  "vivid", "keen", "bliss", "grit", "bold", "calm", "poise",
  "witty", "zest", "quest", "valor", "thrive", "muse", "flair",
]);

interface DictionaryApiEntry {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: DictionaryMeaning[];
}

let cachedKey = "";
let cachedWord: WordOfDay | null = null;

export function isWordOfDay(value: unknown): value is WordOfDay {
  if (!value || typeof value !== "object") return false;
  const candidate = value as WordOfDay;
  return (
    typeof candidate.word === "string" &&
    candidate.word.length > 0 &&
    typeof candidate.definition === "string" &&
    typeof candidate.difficulty === "string"
  );
}

function getDifficulty(word: string): WordOfDay["difficulty"] {
  if (BEGINNER_WORDS.has(word)) return "beginner";
  if (ADVANCED_WORDS.has(word)) return "advanced";
  return "intermediate";
}

/** Map a CEFR level to the difficulty band its word of the day should draw from. */
function bandForLevel(level: string): WordOfDay["difficulty"] | null {
  const l = level.toUpperCase();
  if (l === "A1" || l === "A2") return "beginner";
  if (l === "B1" || l === "B2") return "intermediate";
  if (l === "C1" || l === "C2") return "advanced";
  return null;
}

/** Word pool scoped to the learner's level; full list when level is unknown/empty. */
function wordPool(level?: string): readonly string[] {
  const band = level ? bandForLevel(level) : null;
  if (!band) return WORD_LIST;
  const pool = WORD_LIST.filter((w) => getDifficulty(w) === band);
  return pool.length > 0 ? pool : WORD_LIST;
}

function getDateSeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function pickWord(seed: string, pool: readonly string[]): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return pool[hash % pool.length];
}

function buildFallbackWord(word: string): WordOfDay {
  const fallback = FALLBACK_DEFINITIONS[word.toLowerCase()];
  return {
    word,
    ipa: fallback?.ipa ?? "",
    part_of_speech: fallback?.part_of_speech,
    definition: fallback?.definition ?? "Consulta esta palabra en el diario o diccionario para conocer su significado.",
    example_sentence: fallback?.example_sentence ?? "",
    difficulty: getDifficulty(word),
  };
}

async function fetchWordData(word: string): Promise<WordOfDay | null> {
  const res = await fetch(
    `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
    { signal: AbortSignal.timeout(DICTIONARY_TIMEOUT_MS) },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as DictionaryApiEntry[];
  const entry = data[0];
  if (!entry) return null;

  const phonetic =
    entry.phonetics?.find((item) => item.text)?.text ??
    entry.phonetic ??
    "";

  const sense = selectDictionarySense(entry.meanings);
  if (!sense) return null;

  return {
    word,
    ipa: phonetic,
    part_of_speech: sense.partOfSpeech,
    definition: sense.definition,
    example_sentence: sense.example,
    difficulty: getDifficulty(word),
  };
}

export async function getWordOfDay(
  options?: { forceRefresh?: boolean; level?: string },
): Promise<WordOfDay> {
  const forceRefresh = options?.forceRefresh ?? false;
  const level = options?.level;
  const dateSeed = getDateSeed();
  // Cache identity spans day + level so learners at different levels (or after
  // levelling up) get their own word instead of a stale cross-level one.
  const key = level ? `${dateSeed}|${level.toUpperCase()}` : dateSeed;
  const seed = forceRefresh ? `${key}-${Date.now()}` : key;
  const pool = wordPool(level);

  if (!forceRefresh && cachedKey === key && cachedWord) {
    return cachedWord;
  }

  const attempts = 3;
  let result: WordOfDay | null = null;

  for (let i = 0; i < attempts; i++) {
    const word = pickWord(i === 0 ? seed : `${seed}-retry-${i}`, pool);
    result = await fetchWordData(word).catch(() => null);
    if (result) break;
  }

  if (!result) {
    result = buildFallbackWord(pickWord(key, pool));
  }

  if (!forceRefresh) {
    cachedKey = key;
    cachedWord = result;
  }

  return result;
}
