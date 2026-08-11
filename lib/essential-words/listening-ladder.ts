import { modeHasData, type EssentialWordMode } from "./exercise-modes";
import type { EssentialWord } from "./types";
import type { AttemptLog, LearningItem } from "./verification/types";

export type ListeningLadderLevel = 1 | 2 | 3;
export type ListeningLadderReason =
  | "initial"
  | "provisional"
  | "consecutive-successes"
  | "consecutive-failures"
  | "long-lapse"
  | "no-evidence-change";

export interface ListeningLadderState {
  level: ListeningLadderLevel;
  source: "evidence";
  reason: ListeningLadderReason;
}

export interface ListeningLadderModeResolution {
  requestedLevel: ListeningLadderLevel;
  resolvedLevel: ListeningLadderLevel;
  mode: EssentialWordMode;
}

type ListeningOutcome = "success" | "failure" | "neutral";


function isListeningAttempt(attempt: AttemptLog): boolean {
  return attempt.observations.some((observation) =>
    observation.skill === "listening"
    && observation.basis.kind === "attempt"
    && observation.basis.modality === "listening",
  );
}

function listeningOutcome(attempt: AttemptLog): ListeningOutcome | null {
  const observation = attempt.observations.find((entry) =>
    entry.skill === "listening"
    && entry.basis.kind === "attempt"
    && entry.basis.modality === "listening",
  );
  if (!observation) return null;
  // A hinted success is deliberately neutral: it neither helps promotion nor
  // masks an existing failure streak that should still be diagnosable.
  if (observation.outcome === "success" && attempt.assessment.usedHints) return "neutral";
  return observation.outcome === "success" ? "success" : "failure";
}

function clampLevel(level: number): ListeningLadderLevel {
  return Math.max(1, Math.min(3, level)) as ListeningLadderLevel;
}

/**
 * Replays all user listening evidence into one global three-tier difficulty.
 */
export function deriveListeningLadderLevel(
  item: LearningItem,
  attempts: readonly AttemptLog[],
  now: Date,
): ListeningLadderState {
  const listeningAttempts = attempts
    .filter(isListeningAttempt)
    .slice()
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
  let level: ListeningLadderLevel = 1;
  let successes = 0;
  let failures = 0;
  let reason: ListeningLadderReason = "initial";
  for (const attempt of listeningAttempts) {
    const outcome = listeningOutcome(attempt);
    if (outcome === "neutral" || !outcome) continue;
    if (outcome === "success") {
      successes += 1;
      failures = 0;
      if (successes >= 3) {
        const next = clampLevel(level + 1);
        if (next !== level) reason = "consecutive-successes";
        level = next;
        successes = 0;
      }
    } else {
      failures += 1;
      successes = 0;
      if (failures >= 2) {
        const next = clampLevel(level - 1);
        if (next !== level) reason = "consecutive-failures";
        level = next;
        failures = 0;
      }
    }
  }

  return {
    level,
    source: "evidence",
    reason: listeningAttempts.length === 0 ? "initial" : reason === "initial" ? "no-evidence-change" : reason,
  };
}

/**
 * Resolves only declared/implemented levels. A missing card or unusable
 * content falls back down the ladder; callers must exclude a null result.
 */
export function resolveListeningLadderMode(
  entry: EssentialWord,
  requestedLevel: ListeningLadderLevel,
): ListeningLadderModeResolution | null {
  const available = [1, 2, 3].filter((level) => level <= requestedLevel).sort((left, right) => right - left) as ListeningLadderLevel[];
  for (const level of available) {
    const mode: EssentialWordMode = level === 3 ? "dictation_sentence" : "listening_cloze_sentence";
    if (mode && modeHasData(entry, mode)) return { requestedLevel, resolvedLevel: level, mode };
  }
  return null;
}
