/**
 * Phonetic similarity map for English phonemes (RP).
 * Used to pick smart distractors: a learner confusing /ɪ/ should be tested
 * against /iː/ or /e/ — not against /w/ or /ŋ/.
 *
 * Each entry maps a target IPA (with slashes, matching Supabase `sounds.ipa`)
 * to an ordered list of phonemes most commonly confused with it.
 * Order = priority. The first entries are the most useful distractors.
 *
 * Special focus on Spanish-speaker confusions:
 *   - /iː/-/ɪ/ (sheep/ship): no vowel length in Spanish
 *   - /b/-/v/: /v/ doesn't exist in Spanish, neutralized to [b/β]
 *   - /s/-/z/: /z/ doesn't exist in Spanish
 *   - /θ/-/s/: only in Peninsular Spanish; LATAM speakers merge both
 *   - /j/-/dʒ/ (yes/jess): Spanish "y" varies wildly by dialect
 *   - /ʌ/-/æ/-/ɑː/ (cup/cap/carp): Spanish has only /a/
 *   - Final voiced stops /b d g/: Spanish devoices/spirantizes finals
 *   - /h/: silent in Spanish, often dropped or replaced with /x/
 */
export const PHONEME_CONFUSION: Record<string, readonly string[]> = {
  // ─── Vowels (monophthongs) ──────────────────────────────────────────────
  "/iː/": ["/ɪ/", "/e/", "/eɪ/"],
  "/ɪ/":  ["/iː/", "/e/", "/ə/"],
  "/e/":  ["/æ/", "/ɪ/", "/eɪ/", "/ʌ/"],
  "/æ/":  ["/e/", "/ʌ/", "/ɑː/"],
  "/ɑː/": ["/ʌ/", "/æ/", "/ɒ/"],
  "/ɒ/":  ["/ɔː/", "/ɑː/", "/ʌ/"],
  "/ɔː/": ["/ɒ/", "/əʊ/", "/ɜː/"],
  "/ʊ/":  ["/uː/", "/ə/", "/ʌ/"],
  "/uː/": ["/ʊ/", "/əʊ/", "/ɔː/"],
  "/ʌ/":  ["/æ/", "/ɑː/", "/ə/"],
  "/ɜː/": ["/ə/", "/ɔː/", "/ʌ/"],
  "/ə/":  ["/ʌ/", "/ɜː/", "/ɪ/"],

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
  "/eɪ/": ["/aɪ/", "/e/", "/iː/"],
  "/aɪ/": ["/eɪ/", "/ɔɪ/", "/aʊ/"],
  "/ɔɪ/": ["/aɪ/", "/ɔː/", "/əʊ/"],
  "/əʊ/": ["/aʊ/", "/ɔː/", "/uː/"],
  "/aʊ/": ["/əʊ/", "/aɪ/", "/ɑː/"],
  "/ɪə/": ["/eə/", "/ɪ/", "/iː/"],
  "/eə/": ["/ɪə/", "/e/", "/æ/"],
  "/ʊə/": ["/ɔː/", "/ʊ/", "/uː/"],
} as const;

/**
 * Rough phoneme categories for sensible fallbacks when the confusion map
 * doesn't yield enough candidates.
 */
const VOWELS = new Set([
  "/iː/", "/ɪ/", "/e/", "/æ/", "/ɑː/", "/ɒ/", "/ɔː/",
  "/ʊ/", "/uː/", "/ʌ/", "/ɜː/", "/ə/",
  "/eɪ/", "/aɪ/", "/ɔɪ/", "/əʊ/", "/aʊ/", "/ɪə/", "/eə/", "/ʊə/",
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