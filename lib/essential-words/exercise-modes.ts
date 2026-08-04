import { clozeFor } from "./cloze";
import type { EssentialWordQueueItem } from "./queue";
import type { EssentialWord } from "./types";

/**
 * How a due word is practiced. `speak_sentence` is the universal fallback:
 * `example_sentence` is mandatory on every entry, so it always has data.
 */
export type EssentialWordMode =
  | "study"
  | "recognize_translation"
  | "recognize_meaning"
  | "recognize_audio"
  | "dictation_sentence"
  | "cloze_sentence"
  | "weak_form"
  | "recall_translation"
  | "speak_sentence";

/**
 * The optional `EssentialWord` field each mode needs. Modes backed by a
 * mandatory field — or by a computed check (cloze) — map to null. Exported so
 * tests can assert the invariant that a mode is never chosen without data.
 */
export const MODE_REQUIRED_FIELD: Record<
  EssentialWordMode,
  keyof EssentialWord | null
> = {
  study: null,
  recognize_translation: "translation",
  recognize_meaning: "meaning",
  recognize_audio: null, // only needs `word` + TTS, both always available
  dictation_sentence: null, // example_sentence is mandatory
  cloze_sentence: null, // computed: clozeFor(entry) must be non-null
  weak_form: "ipa_weak",
  recall_translation: "translation", // ES prompt → user produces the English
  speak_sentence: null, // example_sentence is mandatory
};

/** Maturity tiers, driven by SM-2 consecutive-correct count. */
const TENDER_MAX = 2;
const MIDDLE_MAX = 5;

/** True when `entry` has everything `mode` needs to render. */
export function modeHasData(entry: EssentialWord, mode: EssentialWordMode): boolean {
  const field = MODE_REQUIRED_FIELD[mode];
  if (field && !entry[field]) return false;
  if (mode === "cloze_sentence") return clozeFor(entry) !== null;
  return true;
}

/** Deterministic per-word seed so rotation varies across words, not renders. */
function wordSeed(word: string): number {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return Math.abs(hash);
}

/**
 * Pick from `candidates` rotating deterministically by word + repetitions.
 * If the pick would repeat `previousMode` and another candidate has data,
 * advance one position so two consecutive cards differ.
 */
function pickRotating(
  entry: EssentialWord,
  candidates: EssentialWordMode[],
  repetitions: number,
  previousMode?: EssentialWordMode,
): EssentialWordMode {
  const usable = candidates.filter((mode) => modeHasData(entry, mode));
  if (usable.length === 0) return "speak_sentence";
  let index = (wordSeed(entry.word) + repetitions) % usable.length;
  if (usable[index] === previousMode && usable.length > 1) {
    index = (index + 1) % usable.length;
  }
  return usable[index];
}

/**
 * Pick how to practice this item.
 *
 * New words study. Otherwise the SRS maturity tier decides the candidate set,
 * and a deterministic rotation (word hash + repetitions) walks through it so
 * the same word is practiced differently across reviews. `learning` items (a
 * lapse re-inserted mid-session) always get recognition — they just failed,
 * so production would only fail again.
 *
 * `previousMode` is the mode of the card graded just before this one; when
 * provided, the rotation avoids repeating it if an alternative has data.
 *
 * Never returns a mode whose backing data is missing; falls back to
 * `speak_sentence`, which is always renderable.
 */
export function selectMode(
  item: EssentialWordQueueItem,
  previousMode?: EssentialWordMode,
): EssentialWordMode {
  if (item.kind === "new") return "study";
  // A word coming back from snooze gets full production: that card is the only
  // one offering the keep-snoozed / already-mastered decision, which is the
  // whole point of resurfacing it.
  if (item.fromSnooze) return "speak_sentence";

  const { entry } = item;
  const reps = item.repetitions ?? 0;
  const recognition: EssentialWordMode[] = [
    "recognize_translation",
    "recognize_meaning",
    "recognize_audio",
  ];

  if (item.kind === "learning" || reps <= TENDER_MAX) {
    return pickRotating(entry, recognition, reps, previousMode);
  }
  if (reps <= MIDDLE_MAX) {
    return pickRotating(
      entry,
      ["weak_form", "dictation_sentence", "cloze_sentence"],
      reps,
      previousMode,
    );
  }
  return pickRotating(
    entry,
    ["speak_sentence", "cloze_sentence", "recall_translation"],
    reps,
    previousMode,
  );
}
