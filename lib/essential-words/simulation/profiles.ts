import type { AttemptModality } from "../verification/types";
import type { RandomSource } from "./random";

export type SimulationProfileId =
  | "steady"
  | "intermittent"
  | "bursty"
  | "beginner"
  | "advanced";

export interface SimulationProfile {
  id: SimulationProfileId;
  practicePattern:
    | { kind: "probability"; dailyRate: number }
    | { kind: "cycle"; activeDays: number; idleDays: number };
  accuracyByModality: Record<AttemptModality, number>;
  completionBudgetRatio: number;
  placementConfidence: "none" | "low" | "high";
  alreadyKnownOverestimateRate: number;
  audioReplayRate: number;
}

export const PROFILES: Record<SimulationProfileId, SimulationProfile> = {
  steady: {
    id: "steady",
    practicePattern: { kind: "probability", dailyRate: 1 },
    accuracyByModality: {
      recognition: 0.9,
      production: 0.82,
      listening: 0.8,
      pronunciation: 0.78,
    },
    completionBudgetRatio: 1,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.05,
    audioReplayRate: 0.1,
  },
  intermittent: {
    id: "intermittent",
    practicePattern: { kind: "probability", dailyRate: 0.5 },
    accuracyByModality: {
      recognition: 0.86,
      production: 0.75,
      listening: 0.72,
      pronunciation: 0.7,
    },
    completionBudgetRatio: 0.9,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.08,
    audioReplayRate: 0.15,
  },
  bursty: {
    id: "bursty",
    practicePattern: { kind: "cycle", activeDays: 7, idleDays: 14 },
    accuracyByModality: {
      recognition: 0.86,
      production: 0.74,
      listening: 0.7,
      pronunciation: 0.68,
    },
    completionBudgetRatio: 1,
    placementConfidence: "low",
    alreadyKnownOverestimateRate: 0.08,
    audioReplayRate: 0.16,
  },
  beginner: {
    id: "beginner",
    practicePattern: { kind: "probability", dailyRate: 0.85 },
    accuracyByModality: {
      recognition: 0.68,
      production: 0.52,
      listening: 0.5,
      pronunciation: 0.48,
    },
    completionBudgetRatio: 0.9,
    placementConfidence: "none",
    alreadyKnownOverestimateRate: 0.12,
    audioReplayRate: 0.25,
  },
  advanced: {
    id: "advanced",
    practicePattern: { kind: "probability", dailyRate: 0.9 },
    accuracyByModality: {
      recognition: 0.96,
      production: 0.9,
      listening: 0.9,
      pronunciation: 0.86,
    },
    completionBudgetRatio: 1,
    placementConfidence: "high",
    alreadyKnownOverestimateRate: 0.15,
    audioReplayRate: 0.08,
  },
};

export function isPracticeDay(
  profile: SimulationProfile,
  dayIndex: number,
  random: RandomSource,
): boolean {
  if (!Number.isInteger(dayIndex) || dayIndex < 0) {
    throw new Error("dayIndex must be a non-negative integer");
  }

  if (profile.practicePattern.kind === "probability") {
    return random.chance(profile.practicePattern.dailyRate);
  }

  const { activeDays, idleDays } = profile.practicePattern;
  return dayIndex % (activeDays + idleDays) < activeDays;
}

export function buildPracticeCalendar(
  profile: SimulationProfile,
  days: number,
  random: RandomSource,
): boolean[] {
  if (!Number.isInteger(days) || days < 0) {
    throw new Error("days must be a non-negative integer");
  }
  return Array.from({ length: days }, (_, dayIndex) => (
    isPracticeDay(profile, dayIndex, random)
  ));
}

export function answerCorrectly(
  profile: SimulationProfile,
  modality: AttemptModality,
  random: RandomSource,
): boolean {
  return random.chance(profile.accuracyByModality[modality]);
}
