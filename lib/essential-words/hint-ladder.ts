// Length-aware, mode-aware hint ladder (spec §2.3). Pure — no I/O, no
// rendering. HintButton.tsx (Task 5) walks this ladder; attempt-grade.ts
// only cares about the COUNT of priced rungs used (AttemptOutcome.hintsUsed),
// not which rungs specifically — that distinction lives here.

import type { EssentialWord } from "./types";
import type { EssentialWordMode } from "./exercise-modes";
import { essentialWordPosLabel } from "./pos-label";

export type HintRungKind = "category" | "audio" | "firstLetter" | "reveal";

export interface HintRung {
  kind: HintRungKind;
  /** Human-readable hint content (Spanish UI copy). Never equals the target
   * word for any rung except `reveal`, which is the explicit give-up step. */
  content: string;
  /** Whether taking this rung counts toward AttemptOutcome.hintsUsed. */
  priced: boolean;
  /** True only for `reveal` — taking it is giving up, not a graded hint;
   * it counts as a fail via `correct: false` on the outcome, not via price. */
  isGiveUp: boolean;
}

const SHORT_WORD_MAX_LENGTH = 4;

/** Audio is free exactly when it IS the exercise's own prompt — the learner
 * hears the answer's phonology as the task itself, not as an assist. */
const AUDIO_IS_PROMPT_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "dictation_word",
  "dictation_sentence",
]);

/** Modes with no hint ladder at all — already reconnaissance, not production. */
const NO_HINT_MODES: ReadonlySet<EssentialWordMode> = new Set([
  "recognize_translation", "recognize_meaning", "recognize_audio", "recognize_cloze",
]);

function posLabel(pos: EssentialWord["pos"]): string {
  return essentialWordPosLabel(pos);
}

function categoryContent(entry: EssentialWord, isShort: boolean): string {
  const label = posLabel(entry.pos);
  return isShort ? label : `${label}, ${entry.word.length} letras`;
}

function firstLetterContent(entry: EssentialWord): string {
  return `${entry.word[0]} ${"_ ".repeat(entry.word.length - 1).trim()}`;
}

/**
 * Builds the hint ladder for one word+mode pairing. Returns [] for
 * multiple-choice modes (no hints at all — eliminating a distractor would
 * make reconnaissance trivial; better to fail fast and get feedback).
 *
 * Longer words (>=5 letters) get 4 rungs: category (with letter count) ->
 * audio -> first letter -> reveal. Short words (2-4 letters) get 3: category
 * (no letter count — "verbo auxiliar, 2 letras" already nearly gives away
 * "be") -> audio -> reveal, skipping the first-letter rung entirely, since
 * "b _" on a 2-letter word gives the whole answer.
 */
export function buildHintLadder(entry: EssentialWord, mode: EssentialWordMode): HintRung[] {
  if (NO_HINT_MODES.has(mode)) return [];

  const isShort = entry.word.length <= SHORT_WORD_MAX_LENGTH;
  const audioPriced = !AUDIO_IS_PROMPT_MODES.has(mode);

  const rungs: HintRung[] = [
    { kind: "category", content: categoryContent(entry, isShort), priced: true, isGiveUp: false },
    { kind: "audio", content: "Escuchar la palabra", priced: audioPriced, isGiveUp: false },
  ];
  if (!isShort) {
    rungs.push({ kind: "firstLetter", content: firstLetterContent(entry), priced: true, isGiveUp: false });
  }
  rungs.push({ kind: "reveal", content: entry.word, priced: false, isGiveUp: true });
  return rungs;
}
