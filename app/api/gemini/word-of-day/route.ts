import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Curated list of interesting English words for learners (B1–C1 range)
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
];

// Difficulty mapping based on word complexity (rough heuristic)
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

function getDifficulty(word: string): "beginner" | "intermediate" | "advanced" {
  if (BEGINNER_WORDS.has(word)) return "beginner";
  if (ADVANCED_WORDS.has(word)) return "advanced";
  return "intermediate";
}

interface DictionaryApiEntry {
  word?: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
}

async function fetchWordData(word: string): Promise<{
  word: string;
  ipa: string;
  definition: string;
  example_sentence: string;
  difficulty: "beginner" | "intermediate" | "advanced";
} | null> {
  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;

  const data: DictionaryApiEntry[] = await res.json();
  const entry = data[0];
  if (!entry) return null;

  // IPA
  const phonetic =
    entry.phonetics?.find(p => p.text)?.text ??
    entry.phonetic ??
    "";

  // First definition + example
  const firstMeaning = entry.meanings?.[0];
  const firstDef = firstMeaning?.definitions?.[0];
  if (!firstDef?.definition) return null;

  return {
    word,
    ipa: phonetic,
    definition: firstDef.definition,
    example_sentence: firstDef.example ?? "",
    difficulty: getDifficulty(word),
  };
}

// In-memory cache — resets on cold start, fine for serverless
let cachedDate = "";
let cachedWord: object | null = null;

function getDateSeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function pickWord(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return WORD_LIST[hash % WORD_LIST.length];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const forceRefresh = searchParams.get("refresh") === "1";
  const dateSeed = getDateSeed();
  const seed = forceRefresh ? `${dateSeed}-${Date.now()}` : dateSeed;

  if (!forceRefresh && cachedDate === dateSeed && cachedWord) {
    return NextResponse.json(cachedWord, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  }

  // Try up to 3 random words in case the dictionary API doesn't have one
  const attempts = forceRefresh ? 3 : 1;
  let result = null;

  for (let i = 0; i < attempts; i++) {
    const word = pickWord(i === 0 ? seed : `${seed}-retry-${i}`);
    result = await fetchWordData(word).catch(() => null);
    if (result) break;
  }

  // Last resort: pick any word from the list that the API knows
  if (!result) {
    const fallbackWord = pickWord(dateSeed);
    result = {
      word: fallbackWord,
      ipa: "",
      definition: "Look this word up in a dictionary to learn its meaning.",
      example_sentence: "",
      difficulty: getDifficulty(fallbackWord) as "beginner" | "intermediate" | "advanced",
    };
  }

  if (!forceRefresh) {
    cachedDate = dateSeed;
    cachedWord = result;
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": forceRefresh ? "no-store" : "public, max-age=3600" },
  });
}
