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
  | "dictation_sentence"
  | "weak_form"
  | "speak_sentence";

/**
 * The optional `EssentialWord` field each mode needs. Modes backed by a
 * mandatory field map to null. Exported so tests can assert the invariant that
 * a mode is never chosen without its data.
 */
export const MODE_REQUIRED_FIELD: Record<
  EssentialWordMode,
  keyof EssentialWord | null
> = {
  study: null,
  recognize_translation: "translation",
  recognize_meaning: "meaning",
  dictation_sentence: null, // example_sentence is mandatory
  weak_form: "ipa_weak",
  speak_sentence: null, // example_sentence is mandatory
};

/** Maturity tiers, driven by SM-2 consecutive-correct count. */
const TENDER_MAX = 2;
const MIDDLE_MAX = 5;

function hasData(entry: EssentialWord, mode: EssentialWordMode): boolean {
  const field = MODE_REQUIRED_FIELD[mode];
  if (!field) return true;
  return Boolean(entry[field]);
}

/** First mode whose backing data is present, else `speak_sentence`. */
function firstUsable(
  entry: EssentialWord,
  candidates: EssentialWordMode[],
): EssentialWordMode {
  return candidates.find((mode) => hasData(entry, mode)) ?? "speak_sentence";
}

/**
 * Pick how to practice this item.
 *
 * New words study. Otherwise the SRS maturity tier decides: recognition while
 * the word is tender, dictation/weak-form in the middle, full production once
 * it is mature. `learning` items (a lapse re-inserted mid-session) always get
 * recognition — they just failed, so production would only fail again.
 *
 * Never returns a mode whose backing data is missing; falls back to
 * `speak_sentence`, which is always renderable.
 */
export function selectMode(item: EssentialWordQueueItem): EssentialWordMode {
  if (item.kind === "new") return "study";

  const { entry } = item;
  const recognition: EssentialWordMode[] = [
    "recognize_translation",
    "recognize_meaning",
  ];

  if (item.kind === "learning") return firstUsable(entry, recognition);

  const reps = item.repetitions ?? 0;
  if (reps <= TENDER_MAX) return firstUsable(entry, recognition);
  if (reps <= MIDDLE_MAX) {
    return firstUsable(entry, ["weak_form", "dictation_sentence"]);
  }
  return "speak_sentence";
}
