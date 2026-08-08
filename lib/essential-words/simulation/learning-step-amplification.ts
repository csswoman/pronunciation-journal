// Task 8.9f §5 — cuánto mandatory viene de Learning/Relearning y cuánta
// amplificación produce una palabra nueva o un lapso. No cambia FSRS: mide
// su salida ya existente en `srsEvents`/`attemptLogs`.
import type { AttemptModality } from "../verification/types";
import type { SimulationResult } from "./types";

export interface LearningStepAmplification {
  introducedWords: number;
  lapses: number;
  learningStepsFromNewWord: number;
  learningStepsFromLapse: number;
  learningStepsOther: number;
  learningStepsTotal: number;
  learningStepsCreatedPerNewWord: number;
  learningStepsCreatedPerLapse: number;
  learningStepSecondsPerNewWord: number;
}

/**
 * Une `attemptLog.eventType === "learning-step"` con el `srsEvent`
 * correspondiente (mismo `attemptLogId`) para saber si el `priorSchedule`
 * era `Learning` (viene directo de palabra nueva) o `Relearning` (viene de
 * un lapso). No reclasifica nada: sólo lee el estado FSRS ya registrado.
 */
export function computeLearningStepAmplification(
  result: SimulationResult,
  costs: Record<AttemptModality, number>,
): LearningStepAmplification {
  const attemptById = new Map(result.attemptLogs.map((attempt) => [attempt.id, attempt]));
  const learningStepAttemptIds = new Set(
    result.attemptLogs
      .filter((attempt) => attempt.eventType === "learning-step")
      .map((attempt) => attempt.id),
  );

  let learningStepsFromNewWord = 0;
  let learningStepsFromLapse = 0;
  let learningStepsOther = 0;
  let lapses = 0;
  let learningStepSecondsTotal = 0;

  for (const event of result.srsEvents) {
    const attempt = attemptById.get(event.attemptLogId);
    if (!attempt) continue;

    if (
      event.priorSchedule.kind === "fsrs"
      && event.priorSchedule.state === "Review"
      && event.resultingSchedule.kind === "fsrs"
      && event.resultingSchedule.state === "Relearning"
    ) {
      lapses += 1;
    }

    if (!learningStepAttemptIds.has(attempt.id)) continue;
    learningStepSecondsTotal += costs[attempt.assessment.modality];
    if (event.priorSchedule.kind === "fsrs" && event.priorSchedule.state === "Learning") {
      learningStepsFromNewWord += 1;
    } else if (event.priorSchedule.kind === "fsrs" && event.priorSchedule.state === "Relearning") {
      learningStepsFromLapse += 1;
    } else {
      learningStepsOther += 1;
    }
  }

  const introducedWords = result.world.introducedWords;
  const learningStepsTotal = learningStepsFromNewWord + learningStepsFromLapse + learningStepsOther;

  return {
    introducedWords,
    lapses,
    learningStepsFromNewWord,
    learningStepsFromLapse,
    learningStepsOther,
    learningStepsTotal,
    learningStepsCreatedPerNewWord: learningStepsFromNewWord / Math.max(1, introducedWords),
    learningStepsCreatedPerLapse: learningStepsFromLapse / Math.max(1, lapses),
    learningStepSecondsPerNewWord: learningStepSecondsTotal / Math.max(1, introducedWords),
  };
}

