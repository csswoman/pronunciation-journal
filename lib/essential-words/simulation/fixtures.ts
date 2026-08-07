import { learningItemId } from "../skill-item";
import type { BaseSkill, LearningItem, UsageKind } from "../verification/types";

export type BaseLearningItem<S extends BaseSkill = BaseSkill> =
  Extract<LearningItem, { skill: BaseSkill }> & { skill: S };

export const SIMULATION_BASE_SKILLS: readonly BaseSkill[] = [
  "meaning",
  "listening",
  "production",
];

export function simulationWordId(rank: number): string {
  return `c1k:sim-${rank.toString().padStart(4, "0")}`;
}

export function baseLearningItem<S extends BaseSkill>(
  wordId: string,
  skill: S,
): BaseLearningItem<S> {
  return {
    id: learningItemId(wordId, skill),
    wordId,
    skill,
    contentOrigin: "authored",
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  };
}

function addUtcDays(startAt: string, days: number): string {
  const date = new Date(startAt);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function usageLearningItem(
  wordId: string,
  expression: string,
  sentence: string,
  usageKind: UsageKind,
  contentOrigin: "authored" | "generated",
  readyAt: string,
): LearningItem {
  return {
    id: learningItemId(wordId, "usage", expression),
    wordId,
    skill: "usage",
    contentOrigin,
    ...(contentOrigin === "generated" ? { generatorProvider: "gemini" as const } : {}),
    payload: {
      usageKind,
      expression,
      sentence,
      acceptedVariants: [],
      generationStatus: "ready",
      generatedAt: readyAt,
      metadata: {
        schemaVersion: 1,
        reviewed: contentOrigin === "authored",
        ...(contentOrigin === "generated" ? {
          generatorVersion: "simulation-v1",
          promptVersion: "simulation-v1",
          modelVersion: "fixture",
        } : {}),
      },
    },
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  };
}

export function usageContentFixtures(
  wordId: string,
  rank: number,
  startAt: string,
): Array<{ item: LearningItem; readyAt: string }> {
  const contextReadyAt = addUtcDays(startAt, rank % 4);
  const advancedReadyAt = addUtcDays(startAt, 7 + (rank % 14));

  return [
    {
      item: usageLearningItem(
        wordId,
        `context phrase ${rank}`,
        `The simulated learner uses word ${rank} in context.`,
        "context_usage",
        "authored",
        contextReadyAt,
      ),
      readyAt: contextReadyAt,
    },
    {
      item: usageLearningItem(
        wordId,
        `advanced phrase ${rank}`,
        `The simulated learner applies advanced usage ${rank}.`,
        "advanced_usage",
        "generated",
        advancedReadyAt,
      ),
      readyAt: advancedReadyAt,
    },
  ];
}
