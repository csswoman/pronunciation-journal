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
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}

let cachedDate = "";
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

function getDateSeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function pickWord(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return WORD_LIST[hash % WORD_LIST.length];
}

function buildFallbackWord(word: string): WordOfDay {
  return {
    word,
    ipa: "",
    definition: "Look this word up in a dictionary to learn its meaning.",
    example_sentence: "",
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

  const meaningWithExample =
    entry.meanings?.find((meaning) =>
      meaning.definitions?.some((definition) => definition.example && definition.definition),
    ) ?? entry.meanings?.[0];

  const definition =
    meaningWithExample?.definitions?.find((item) => item.example && item.definition) ??
    meaningWithExample?.definitions?.[0];

  if (!definition?.definition) return null;

  return {
    word,
    ipa: phonetic,
    part_of_speech: meaningWithExample?.partOfSpeech ?? "",
    definition: definition.definition,
    example_sentence: definition.example ?? "",
    difficulty: getDifficulty(word),
  };
}

export async function getWordOfDay(options?: { forceRefresh?: boolean }): Promise<WordOfDay> {
  const forceRefresh = options?.forceRefresh ?? false;
  const dateSeed = getDateSeed();
  const seed = forceRefresh ? `${dateSeed}-${Date.now()}` : dateSeed;

  if (!forceRefresh && cachedDate === dateSeed && cachedWord) {
    return cachedWord;
  }

  const attempts = 3;
  let result: WordOfDay | null = null;

  for (let i = 0; i < attempts; i++) {
    const word = pickWord(i === 0 ? seed : `${seed}-retry-${i}`);
    result = await fetchWordData(word).catch(() => null);
    if (result) break;
  }

  if (!result) {
    result = buildFallbackWord(pickWord(dateSeed));
  }

  if (!forceRefresh) {
    cachedDate = dateSeed;
    cachedWord = result;
  }

  return result;
}
