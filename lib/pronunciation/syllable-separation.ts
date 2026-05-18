export const SYLLABLE_SEPARATOR = "·";

const syllableCache = new Map<string, Promise<string>>();

type Hyphenate = (word: string, options?: { hyphenChar?: string }) => Promise<string>;
let hyphenatePromise: Promise<Hyphenate> | null = null;

function getHyphenate(): Promise<Hyphenate> {
  if (!hyphenatePromise) {
    hyphenatePromise = import("hyphen/en").then((mod) => mod.hyphenate);
  }

  return hyphenatePromise;
}

function shouldInferSyllables(word: string): boolean {
  return word.length > 1 && /[A-Za-z]/.test(word);
}

export function resolveSyllableWord(word: string): Promise<string> {
  const trimmed = word.trim();
  if (!trimmed) return Promise.resolve(word);
  if (trimmed.includes(SYLLABLE_SEPARATOR) || !shouldInferSyllables(trimmed)) {
    return Promise.resolve(word);
  }

  const cacheKey = trimmed.toLowerCase();
  const cached = syllableCache.get(cacheKey);
  if (cached) return cached;

  const resolved = getHyphenate()
    .then((hyphenate) => hyphenate(trimmed, { hyphenChar: SYLLABLE_SEPARATOR }))
    .then((hyphenated) => hyphenated || word)
    .catch(() => word);

  syllableCache.set(cacheKey, resolved);
  return resolved;
}

export function splitBySyllableSeparator(word: string): string[] {
  return word.split(SYLLABLE_SEPARATOR);
}
