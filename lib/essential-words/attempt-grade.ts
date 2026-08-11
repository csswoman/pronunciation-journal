// The single place AttemptOutcome -> Grade happens (spec §2.1). Cards emit
// AttemptOutcome, never a raw number — this is what makes the eventual
// SM-2 -> FSRS migration (Fase C) a one-file change instead of a rewrite of
// every card.

export type AttemptResult = 'correcto' | 'casi' | 'incorrecto'
export type AttemptWordCategory = 'ok' | 'spelling' | 'phonetic_substitution' | 'omission' | 'insertion' | 'grammatical' | 'guess' | 'ortografia' | 'no_percibida' | 'sobrante'
export type AttemptSkill = 'listening' | 'production'
export type AttemptSkillVerdict = 'acierto' | 'fallo' | 'neutro'

/** Diagnostic evidence that can later be routed to a skill-specific item. */
export interface AttemptWordEvidence {
  expected?: string
  written?: string
  categoria: AttemptWordCategory
  isTarget?: boolean
  expectedIpa?: string
  writtenIpa?: string
  contrastId?: string
}

export interface AttemptSkillEvidence {
  habilidad: AttemptSkill
  veredicto: AttemptSkillVerdict
}

/** What actually happened on one graded attempt. Cards build this; nothing
 * downstream should reconstruct it from partial data. */
export interface AttemptOutcome {
  correct: boolean;
  /** Count of PRICED hint-ladder rungs only (see hint-ladder.ts) — free rungs
   * (e.g. unlimited dictation-audio replay) never increment this. */
  hintsUsed: number;
  /** True when the attempt was rescued to multiple choice after a fail. */
  rescued: boolean;
  /** True when the written answer was a typo of the correct answer (see typo.ts). */
  typo: boolean;
  /** True when the FIRST attempt (before any retry) failed, and this outcome
   * represents the eventual retry that succeeded. */
  firstTryFailed: boolean;
  /** Time from render/first-focus to submit, milliseconds. */
  latencyMs: number;
  /** Optional diagnostic detail. Existing exercise producers remain valid. */
  resultado?: AttemptResult
  palabras?: AttemptWordEvidence[]
  errorDominante?: Exclude<AttemptWordCategory, 'ok'>
  evidencia?: AttemptSkillEvidence[]
  /** Global listening tier rendered for this attempt. */
  listeningTier?: 1 | 2 | 3
  /** Contrast used to choose the blank(s), when the exercise has one. */
  focusContrastId?: string
  guessBlankKeys?: Array<{ sentenceId: string; tokenIndex: number }>
}

export type Grade = "Again" | "Hard" | "Good" | "Easy";

/** Latency threshold below which a clean answer counts as Easy, not Good
 * (spec §2.1: "un acierto correcto a los 25 s es Good, no Easy"). */
export const LOW_LATENCY_MS = 25_000;

/**
 * Maps an AttemptOutcome to a Grade, in precedence order (spec §2.1/§2.4):
 *   1. rescued            -> Again, ALWAYS, regardless of correct/hints/typo.
 *      Rescue is emotional relief, not evaluation (spec §2.4) — it always
 *      grades Again even if the rescued multiple-choice answer is correct.
 *   2. firstTryFailed      -> Again. The initial attempt failed recovery;
 *      that it succeeded on retry only measures working memory, not recall.
 *   3. hintsUsed >= 2      -> Again. Two or more priced hints means the item
 *      is effectively lost for this review — the 3rd hint and reveal are
 *      "free" past this point in terms of grade (spec §2.7): once Again is
 *      locked in, using more hints cannot make the grade worse.
 *   4. hintsUsed === 1     -> Hard.
 *   5. correct, no hints, latency < LOW_LATENCY_MS -> Easy.
 *   6. correct, no hints, otherwise                -> Good.
 *   7. not correct (and none of the above applied) -> Again.
 *
 * Typo is deliberately NOT a branch here: a typo-flagged outcome is treated
 * as `correct: true` by the caller before this function ever sees it (spec
 * §2.6 — "se acepta, se marca la corrección y no se penaliza"), so it falls
 * through to the same Easy/Good branches as a clean correct answer.
 */
export function attemptGrade(outcome: AttemptOutcome): Grade {
  if (outcome.rescued) return "Again";
  if (outcome.firstTryFailed) return "Again";
  if (outcome.hintsUsed >= 2) return "Again";
  if (outcome.hintsUsed === 1) return "Hard";
  if (!outcome.correct) return "Again";
  return outcome.latencyMs < LOW_LATENCY_MS ? "Easy" : "Good";
}

/**
 * Bridges Grade to the existing 0-5 "quality" scale useEssentialWordsSession
 * .ts's submitGrade already branches on (quality >= 3 = pass). This lets
 * every card call the unchanged Fase A hook while still building its outcome
 * through attemptGrade — Fase C's FSRS migration replaces this bridge with
 * a direct Grade-consuming scheduler call, without touching any card again.
 */
export function gradeToLegacyQuality(grade: Grade): number {
  switch (grade) {
    case "Again": return 2;
    case "Hard": return 3;
    case "Good": return 4;
    case "Easy": return 5;
  }
}
