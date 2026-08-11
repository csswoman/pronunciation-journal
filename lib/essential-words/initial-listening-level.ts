import type { SRSData } from "@/lib/types";
import { DICTATION_DIAGNOSTIC_CONFIG } from "./dictation-diagnostic-config";
import type { AttemptLog, LearningItem } from "./verification/types";

export interface InitialListeningLevel {
  level: number;
  provisional: true;
  source: "legacy-srs-v1";
}

export function estimateInitialListeningLevel(source: SRSData | undefined): InitialListeningLevel {
  const policy = DICTATION_DIAGNOSTIC_CONFIG.initialListeningLevel;
  const repetitions = source?.repetitions ?? 0;
  const stability = source?.stability ?? 0;
  const state = source?.state;
  let level = 1;
  if (state === "Review" && repetitions >= policy.strongHistory.minRepetitions && stability >= policy.strongHistory.minStabilityDays) level = policy.strongHistory.level;
  else if (state === "Review" && repetitions >= policy.establishedHistory.minRepetitions && stability >= policy.establishedHistory.minStabilityDays) level = policy.establishedHistory.level;
  else if ((state === "Review" || state === "Learning") && repetitions >= policy.emergingHistory.minRepetitions && stability >= policy.emergingHistory.minStabilityDays) level = policy.emergingHistory.level;
  return { level, provisional: true, source: "legacy-srs-v1" };
}

export function realListeningAttemptCount(attempts: AttemptLog[]): number {
  return attempts.filter((attempt) => attempt.observations.some((observation) =>
    observation.skill === "listening" && observation.basis.kind === "attempt" && observation.basis.modality === "listening",
  )).length;
}

export function retireInitialListeningLevel(
  item: LearningItem,
  attempts: AttemptLog[],
): LearningItem {
  if (item.skill !== "listening" || !item.initialListeningLevel) return item;
  if (realListeningAttemptCount(attempts) < DICTATION_DIAGNOSTIC_CONFIG.initialListeningLevel.realListeningAttemptsToRetire) return item;
  const { initialListeningLevel: _initialListeningLevel, ...withoutEstimate } = item;
  return withoutEstimate as LearningItem;
}
