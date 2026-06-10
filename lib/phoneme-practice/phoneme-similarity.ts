/**
 * Phonetic similarity map for English phonemes (General American).
 * Used to pick smart distractors: a learner confusing /ɪ/ should be tested
 * against /iː/ or /ɛ/ — not against /w/ or /ŋ/.
 *
 * Each entry maps a target IPA (with slashes, matching Supabase `sounds.ipa`)
 * to an ordered list of phonemes most commonly confused with it.
 * Order = priority. The first entries are the most useful distractors.
 *
 * Special focus on Spanish-speaker confusions:
 *   - /iː/-/ɪ/ (sheep/ship): tense/lax distinction doesn't exist in Spanish
 *   - /b/-/v/: /v/ doesn't exist in Spanish, neutralized to [b/β]
 *   - /s/-/z/: /z/ doesn't exist in Spanish
 *   - /θ/-/s/: only in Peninsular Spanish; LATAM speakers merge both
 *   - /j/-/dʒ/ (yes/jess): Spanish "y" varies wildly by dialect
 *   - /ʌ/-/æ/-/ɑ/ (cup/cap/cop): Spanish has only /a/
 *   - Final voiced stops /b d g/: Spanish devoices/spirantizes finals
 *   - /h/: silent in Spanish, often dropped or replaced with /x/
 */
export const PHONEME_CONFUSION: Record<string, readonly string[]> = {
  // ─── Vowels (monophthongs) ──────────────────────────────────────────────
  "/iː/": ["/ɪ/", "/ɛ/", "/eɪ/"],
  "/ɪ/":  ["/iː/", "/ɛ/", "/ə/"],
  "/ɛ/":  ["/æ/", "/ɪ/", "/eɪ/", "/ʌ/"],
  "/æ/":  ["/ɛ/", "/ʌ/", "/ɑ/"],
  "/ɑ/":  ["/ʌ/", "/æ/", "/ɔ/"],
  "/ɔ/":  ["/ɑ/", "/oʊ/", "/ɜr/"],
  "/ʊ/":  ["/uː/", "/ə/", "/ʌ/"],
  "/uː/": ["/ʊ/", "/oʊ/", "/ɔ/"],
  "/ʌ/":  ["/æ/", "/ɑ/", "/ə/"],
  "/ɜr/": ["/ə/", "/ɔ/", "/ʌ/"],
  "/ə/":  ["/ʌ/", "/ɜr/", "/ɪ/"],

  // ─── Consonants: stops ──────────────────────────────────────────────────
  "/p/":  ["/b/", "/f/", "/t/"],
  "/b/":  ["/v/", "/p/", "/d/"],   // /v/ first: huge for ES speakers
  "/t/":  ["/d/", "/θ/", "/k/"],
  "/d/":  ["/t/", "/ð/", "/g/"],
  "/k/":  ["/g/", "/t/", "/p/"],
  "/g/":  ["/k/", "/d/", "/b/"],

  // ─── Consonants: fricatives ─────────────────────────────────────────────
  "/f/":  ["/v/", "/θ/", "/p/", "/h/"],
  "/v/":  ["/b/", "/f/", "/w/"],   // /b/ first: huge for ES speakers
  "/θ/":  ["/s/", "/f/", "/t/"],
  "/ð/":  ["/d/", "/z/", "/v/"],
  "/s/":  ["/z/", "/θ/", "/ʃ/"],
  "/z/":  ["/s/", "/ʒ/", "/ð/"],   // /s/ first: /z/ doesn't exist in ES
  "/ʃ/":  ["/tʃ/", "/s/", "/ʒ/"],
  "/ʒ/":  ["/dʒ/", "/ʃ/", "/z/"],
  "/h/":  ["/f/", "/k/", "/x/"],

  // ─── Consonants: affricates ─────────────────────────────────────────────
  "/tʃ/": ["/ʃ/", "/dʒ/", "/t/"],
  "/dʒ/": ["/j/", "/tʃ/", "/ʒ/"],  // /j/ first: yes/jess confusion

  // ─── Consonants: nasals, liquids, glides ────────────────────────────────
  "/m/":  ["/n/", "/b/"],
  "/n/":  ["/m/", "/ŋ/", "/l/"],
  "/ŋ/":  ["/n/", "/g/"],
  "/l/":  ["/r/", "/n/"],
  "/r/":  ["/l/", "/w/"],
  "/j/":  ["/dʒ/", "/ʒ/", "/iː/"],
  "/w/":  ["/v/", "/uː/", "/r/"],

  // ─── Diphthongs ─────────────────────────────────────────────────────────
  "/eɪ/": ["/aɪ/", "/ɛ/", "/iː/"],
  "/aɪ/": ["/eɪ/", "/ɔɪ/", "/aʊ/"],
  "/ɔɪ/": ["/aɪ/", "/ɔ/", "/oʊ/"],
  "/oʊ/": ["/aʊ/", "/ɔ/", "/uː/"],
  "/aʊ/": ["/oʊ/", "/aɪ/", "/ɑ/"],
} as const;

/**
 * Returns the canonical contrast key for a pair of IPA symbols.
 * Always produces the same key regardless of argument order.
 * Format: "ipaA|ipaB" where ipaA <= ipaB (lexicographic).
 *
 * This is the single source of truth for contrast identity — never
 * re-implement the ordering elsewhere.
 */
export function contrastKey(ipaA: string, ipaB: string): string {
  return ipaA <= ipaB ? `${ipaA}|${ipaB}` : `${ipaB}|${ipaA}`
}

/**
 * Returns all contrast keys derivable from PHONEME_CONFUSION.
 * Each pair (A, B) appears exactly once.
 */
export function getAllContrastKeys(): string[] {
  const seen = new Set<string>()
  for (const [ipa, confusables] of Object.entries(PHONEME_CONFUSION)) {
    for (const other of confusables) {
      seen.add(contrastKey(ipa, other))
    }
  }
  return [...seen]
}

/**
 * Rough phoneme categories for sensible fallbacks when the confusion map
 * doesn't yield enough candidates.
 */
const VOWELS = new Set([
  "/iː/", "/ɪ/", "/ɛ/", "/æ/", "/ɑ/", "/ɔ/",
  "/ʊ/", "/uː/", "/ʌ/", "/ɜr/", "/ə/",
  "/eɪ/", "/aɪ/", "/ɔɪ/", "/oʊ/", "/aʊ/",
]);

const isVowel = (ipa: string) => VOWELS.has(ipa);

/**
 * Returns IPA symbols most likely to be confused with the target,
 * filtered to those that exist in `availableIpas`.
 *
 * Strategy:
 *   1. Preferred: phonemes from the confusion map (in priority order)
 *   2. Same-category fallback: other vowels/consonants if still short
 *   3. Last resort: any remaining phoneme
 *
 * @param targetIpa     The phoneme being tested (e.g. "/ɪ/")
 * @param availableIpas Phonemes that exist in your sound DB
 * @param count         How many distractors to return
 * @param rng           Optional RNG for testability (defaults to Math.random)
 */
export function pickConfusableIpas(
  targetIpa: string,
  availableIpas: readonly string[],
  count: number,
  rng: () => number = Math.random
): string[] {
  if (count <= 0) return [];

  const available = new Set(availableIpas);
  available.delete(targetIpa);

  const result: string[] = [];
  const used = new Set<string>();

  // 1. Preferred distractors from the confusion map, in priority order
  for (const ipa of PHONEME_CONFUSION[targetIpa] ?? []) {
    if (available.has(ipa) && !used.has(ipa)) {
      result.push(ipa);
      used.add(ipa);
      if (result.length === count) return result;
    }
  }

  // 2. Same-category fallback (vowel→vowel, consonant→consonant)
  const targetIsVowel = isVowel(targetIpa);
  const sameCategory = [...available].filter(
    ipa => !used.has(ipa) && isVowel(ipa) === targetIsVowel
  );
  shuffle(sameCategory, rng);
  for (const ipa of sameCategory) {
    result.push(ipa);
    used.add(ipa);
    if (result.length === count) return result;
  }

  // 3. Last resort: anything else
  const rest = [...available].filter(ipa => !used.has(ipa));
  shuffle(rest, rng);
  result.push(...rest.slice(0, count - result.length));

  return result;
}

function shuffle<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}