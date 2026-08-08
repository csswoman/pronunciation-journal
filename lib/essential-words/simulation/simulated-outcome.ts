import type { AttemptOutcome } from "../attempt-grade";
import type { PlannedItem } from "../planning-types";
import { answerCorrectly, type SimulationProfile } from "./profiles";
import type { RandomSource } from "./random";

export function simulateAttemptOutcome(
  item: PlannedItem,
  profile: SimulationProfile,
  durationMs: number,
  random: RandomSource,
  scheduledCorrect?: boolean,
): { outcome: AttemptOutcome; freeAudioReplays: number } {
  const correct = scheduledCorrect
    ?? answerCorrectly(profile, item.modality, random);
  const supportRate = (1 - profile.accuracyByModality[item.modality]) * 0.4;
  const hintsUsed = random.chance(supportRate) ? random.integer(1, 2) : 0;
  const firstTryFailed = !correct && random.chance(profile.alreadyKnownOverestimateRate);
  const rescued = !correct && !firstTryFailed && random.chance(0.2);
  const audioModality = item.modality === "listening" || item.modality === "pronunciation";
  const freeAudioReplays = audioModality && random.chance(profile.audioReplayRate)
    ? random.integer(1, 2)
    : 0;

  return {
    outcome: {
      correct,
      hintsUsed,
      rescued,
      typo: false,
      firstTryFailed,
      latencyMs: Math.max(500, Math.round(durationMs * (0.55 + random.next() * 0.3))),
    },
    freeAudioReplays,
  };
}
