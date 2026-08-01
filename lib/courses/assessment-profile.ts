"use client";

import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { persistLearningState } from "@/lib/ai-practice/queries";
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { ConceptSignal } from "@/lib/courses/concept-profile";
import type { CefrLevel } from "@/lib/essential-words/types";
import { db } from "@/lib/db";

export function mergeConceptSignals(
  existing: readonly ConceptSignal[],
  incoming: readonly ConceptSignal[],
): ConceptSignal[] {
  const byLesson = new Map(existing.map((signal) => [signal.lessonSlug, signal]));

  for (const signal of incoming) {
    const previous = byLesson.get(signal.lessonSlug);
    if (!previous || signal.assessedAt >= previous.assessedAt) {
      byLesson.set(signal.lessonSlug, signal);
    }
  }

  return [...byLesson.values()].sort((a, b) =>
    a.level.localeCompare(b.level) || a.lessonSlug.localeCompare(b.lessonSlug)
  );
}

/**
 * Stores assessment-derived theory signals independently from grammar errors.
 * persistLearningState writes Dexie and queues the same snapshot in the outbox.
 */
export async function persistAssessmentConceptProfile(
  userId: string,
  conceptSignals: readonly ConceptSignal[],
  assignedLevel: CefrLevel,
): Promise<UserLearningState> {
  const local = await db.learningState.get(userId);
  const base = local?.state ?? await getUserLearningState(userId);
  const updatedAt = new Date().toISOString();
  const next: UserLearningState = {
    ...base,
    userId,
    updatedAt,
    level: { ...base.level, cefrEstimate: assignedLevel },
    theory: {
      concepts: mergeConceptSignals(base.theory?.concepts ?? [], conceptSignals),
    },
  };

  await persistLearningState(userId, next);
  return next;
}
