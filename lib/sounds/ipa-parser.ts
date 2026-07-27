import { CANONICAL_SOUNDS, canonicalizeSoundIpa } from "./inventory";
import { stripIpaSlashes } from "@/lib/lexicon/format-ipa";

/**
 * IPA tokenizer for content auditing.
 *
 * A plain `.includes()` check is wrong for phoneme membership: /t/ matches
 * inside /tʃ/, /ɔ/ matches inside /ɔɪ/, and /r/ matches inside /ɜr/. This
 * parser segments a transcription into canonical phoneme symbols using
 * longest-match-first, so containment questions can be asked on tokens.
 */

/** Symbols stripped before tokenizing: stress, length, syllable and tie marks. */
const SUPRASEGMENTALS = /[ˈˌ.‿͜͡\s]/g;

/**
 * Dialectal spellings that map onto a canonical GA phoneme.
 *
 * The seed content originated in RP (see the GA migration), so RP-only
 * transcriptions still appear in `words.ipa`. These are accepted as evidence
 * that the GA phoneme is present rather than reported as errors.
 */
const DIALECT_EQUIVALENTS: Record<string, string> = {
  // LOT–PALM merge: RP /ɒ/ and long /ɑː/ both surface as GA /ɑ/.
  "ɒ": "ɑ",
  "ɑː": "ɑ",
  // RP length marks that GA writes short.
  "ɔː": "ɔ",
  "ʊə": "ʊ",
  // Non-rhotic RP nurse vowel → rhotic GA /ɜr/.
  "ɜː": "ɜr",
  "ɝ": "ɜr",
  // Schwar: unstressed r-colored schwa is /ə/ + /r/ in this inventory.
  "ɚ": "ər",
  // RP dress vowel written /e/ (bare) is GA /ɛ/. Only safe because /e/ is not
  // a canonical symbol on its own here — /eɪ/ is matched first by length.
  "e": "ɛ",
  // Legacy glyph for the velar plosive.
  "ɡ": "g",
  // happY / commA reduced vowels: bare `i` and `u` are standard GA notation for
  // unstressed final/prevocalic vowels that are neither fully tense nor lax
  // (happy /ˈhæpi/, usual /ˈjuːʒuəl/). Map them onto the tense phoneme they
  // neutralize toward — matched after /iː/ and /uː/ because those are longer.
  "i": "iː",
  "u": "uː",
};

/** Canonical symbols without slashes, longest first for greedy matching. */
const RAW_SYMBOLS = CANONICAL_SOUNDS.map((phoneme) =>
  stripIpaSlashes(phoneme.symbol),
);

const MATCHABLE = [
  ...RAW_SYMBOLS,
  ...Object.keys(DIALECT_EQUIVALENTS),
].sort((a, b) => b.length - a.length);

export interface ParsedIpa {
  /** Canonical phoneme symbols in order, slash-wrapped (e.g. `/h/`). */
  tokens: string[];
  /** Characters that matched no canonical or dialectal symbol. */
  unknown: string[];
}

/**
 * Segment a transcription into canonical phoneme tokens.
 *
 * Unrecognized characters are collected rather than thrown, so a word with one
 * odd glyph still yields usable tokens for the rest of the transcription.
 */
export function parseIpa(ipa: string): ParsedIpa {
  const source = stripIpaSlashes(ipa).replace(SUPRASEGMENTALS, "");
  const tokens: string[] = [];
  const unknown: string[] = [];

  let index = 0;
  while (index < source.length) {
    const match = MATCHABLE.find((symbol) => source.startsWith(symbol, index));
    if (!match) {
      unknown.push(source[index]);
      index += 1;
      continue;
    }

    const resolved = DIALECT_EQUIVALENTS[match] ?? match;
    // A dialect equivalent may expand to several phonemes (/ɚ/ → /ə/ + /r/),
    // so re-tokenize the replacement instead of pushing it whole.
    if (resolved === match) {
      tokens.push(`/${match}/`);
    } else {
      tokens.push(...parseIpa(resolved).tokens);
    }
    index += match.length;
  }

  return { tokens, unknown };
}

/** True when `ipa` contains `soundIpa` as a discrete phoneme, not a substring. */
export function ipaContainsSound(ipa: string, soundIpa: string): boolean {
  const target = canonicalizeSoundIpa(soundIpa);
  return parseIpa(ipa).tokens.includes(target);
}
