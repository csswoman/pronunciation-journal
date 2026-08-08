import type { LearningItem, UsageKind } from "../../../verification/types";

/**
 * Authored content exercises the usage lifecycle without calling a remote
 * generator. The engine only needs a valid payload; generation is a later
 * pipeline concern.
 */
export function authoredUsage(
  wordId: string,
  expression: string,
  sentence: string,
  usageKind: UsageKind = "advanced_usage",
): LearningItem {
  return {
    id: `${wordId}#usage:${expression.replace(/\s+/g, "-")}`,
    wordId,
    skill: "usage",
    contentOrigin: "authored",
    payload: {
      usageKind,
      expression,
      sentence,
      acceptedVariants: [],
      generationStatus: "ready",
      generatedAt: "2026-08-01T00:00:00.000Z",
      metadata: { schemaVersion: 1, reviewed: true },
    },
    schedule: { kind: "none" },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  };
}

export const AUTHORED_ON_USAGES = [
  authoredUsage("c1k:on", "depend on", "The result depends on the weather today."),
  authoredUsage("c1k:on", "on purpose", "She did it on purpose, not by accident."),
  authoredUsage("c1k:on", "on Monday", "We have a meeting on Monday morning.", "context_usage"),
];
