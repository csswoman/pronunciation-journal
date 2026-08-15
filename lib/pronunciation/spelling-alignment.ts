/**
 * Maps English phonemes to their common grapheme (spelling) patterns.
 * Identifies the exact character slice in a word that corresponds to the target phoneme.
 */

const PHONEME_SPELLINGS: Record<string, string[]> = {
  // Vowels
  "/iː/": ["ee", "ea", "ey", "ie", "ei", "e_e", "e", "i"],
  "/ɪ/": ["ui", "y", "i", "e", "o"],
  "/ɛ/": ["ea", "ai", "ay", "e", "a"],
  "/æ/": ["au", "a"],
  "/ɑ/": ["al", "ar", "a", "o"],
  "/ɔ/": ["ough", "augh", "aw", "au", "al", "or", "a", "o"],
  "/ʊ/": ["oul", "oo", "u", "o"],
  "/uː/": ["ough", "ew", "ue", "ui", "oo", "oe", "ou", "u_e", "u", "o"],
  "/ʌ/": ["ou", "oo", "oe", "u", "o"],
  "/ɜr/": ["ear", "our", "ur", "er", "ir", "or"],
  "/ə/": ["a", "e", "i", "o", "u"],

  // Diphthongs
  "/eɪ/": ["eigh", "aigh", "ay", "ai", "ey", "ei", "a_e", "a", "e"],
  "/aɪ/": ["igh", "y_e", "i_e", "ai", "ay", "ey", "ie", "i", "y"],
  "/ɔɪ/": ["oy", "oi"],
  "/oʊ/": ["ough", "ow", "oa", "oe", "o_e", "o"],
  "/aʊ/": ["ough", "ow", "ou"],

  // Consonants
  "/p/": ["pp", "p"],
  "/b/": ["bb", "b"],
  "/t/": ["tt", "ed", "t"],
  "/d/": ["dd", "ed", "d"],
  "/k/": ["ck", "ch", "qu", "k", "c"],
  "/g/": ["gg", "gh", "gu", "g"],
  "/f/": ["ph", "gh", "ff", "f"],
  "/v/": ["ve", "v", "f"],
  "/θ/": ["th"],
  "/ð/": ["th"],
  "/s/": ["ss", "sc", "ce", "ci", "se", "s", "c"],
  "/z/": ["zz", "ze", "es", "s", "z"],
  "/ʃ/": ["tion", "sion", "ch", "sh", "ci", "ti", "ss", "s"],
  "/ʒ/": ["sion", "ge", "s", "z"],
  "/h/": ["wh", "h"],
  "/tʃ/": ["tch", "ch", "t"],
  "/dʒ/": ["dge", "ge", "gi", "j", "g"],
  "/m/": ["mm", "mb", "mn", "m"],
  "/n/": ["nn", "kn", "gn", "pn", "n"],
  "/ŋ/": ["ng", "n"],
  "/l/": ["ll", "le", "l"],
  "/r/": ["wr", "rr", "rh", "r"],
  "/j/": ["y", "u", "i", "j"],
  "/w/": ["wh", "w", "u"],
};

export interface HighlightSegment {
  text: string;
  isTarget: boolean;
}

/**
 * Splits a word into segments, marking which part represents the target phoneme.
 */
export function alignWordToPhoneme(
  word: string,
  phonemeOrIpa: string,
): HighlightSegment[] {
  if (!word) return [];

  const cleanIpa =
    phonemeOrIpa.startsWith("/") && phonemeOrIpa.endsWith("/")
      ? phonemeOrIpa
      : `/${phonemeOrIpa.replace(/^\/|\/$/g, "")}/`;

  const lower = word.toLowerCase();
  const candidatePatterns = PHONEME_SPELLINGS[cleanIpa] ?? [];

  for (const pattern of candidatePatterns) {
    // Handle split digraphs like a_e, i_e, o_e
    if (pattern.includes("_")) {
      const [first, second] = pattern.split("_");
      const firstIdx = lower.indexOf(first);
      if (firstIdx !== -1) {
        const secondIdx = lower.indexOf(second, firstIdx + 2);
        if (secondIdx !== -1 && secondIdx === lower.length - 1) {
          return [
            { text: word.slice(0, firstIdx), isTarget: false },
            { text: word.slice(firstIdx, firstIdx + first.length), isTarget: true },
            { text: word.slice(firstIdx + first.length, secondIdx), isTarget: false },
            { text: word.slice(secondIdx), isTarget: true },
          ].filter((s) => s.text.length > 0);
        }
      }
      continue;
    }

    // Standard substring match
    const idx = lower.indexOf(pattern);
    if (idx !== -1) {
      const before = word.slice(0, idx);
      const match = word.slice(idx, idx + pattern.length);
      const after = word.slice(idx + pattern.length);

      const segments: HighlightSegment[] = [];
      if (before) segments.push({ text: before, isTarget: false });
      segments.push({ text: match, isTarget: true });
      if (after) segments.push({ text: after, isTarget: false });

      return segments;
    }
  }

  // Fallback: no specific pattern found
  return [{ text: word, isTarget: false }];
}
