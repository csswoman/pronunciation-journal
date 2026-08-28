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
    if (!previous) {
      byLesson.set(signal.lessonSlug, signal);
      continue;
    }

    // Manual signal incoming always wins
    if (signal.source === "manual") {
      byLesson.set(signal.lessonSlug, signal);
      continue;
    }

    // If previous was manual, it is preserved unless incoming has real quiz/exercise evidence (total > 0)
    if (previous.source === "manual") {
      const hasRealEvidence = signal.total > 0;
      if (hasRealEvidence && signal.assessedAt >= previous.assessedAt) {
        byLesson.set(signal.lessonSlug, signal);
      }
      continue;
    }

    if (signal.assessedAt >= previous.assessedAt) {
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

export async function updateConceptSignalsWithEvidence(
  userId: string,
  conceptSignals: readonly ConceptSignal[],
): Promise<UserLearningState> {
  const local = await db.learningState.get(userId);
  const base = local?.state ?? await getUserLearningState(userId);
  const updatedAt = new Date().toISOString();

  // Real evidence (source: 'exercise') doubles as "what was studied today" —
  // manual claims don't, since asking for help isn't a completed session.
  const newSessions = conceptSignals
    .filter((s) => s.source === 'exercise' && s.total > 0)
    .map((s) => ({
      topic: s.title || s.lessonSlug,
      endedAt: s.assessedAt,
      exercisesCompleted: s.total,
      correctRate: s.correct / s.total,
    }));

  const next: UserLearningState = {
    ...base,
    userId,
    updatedAt,
    theory: {
      concepts: mergeConceptSignals(base.theory?.concepts ?? [], conceptSignals),
    },
    lastSessions: [...newSessions, ...base.lastSessions].slice(0, 10),
  };

  await persistLearningState(userId, next);
  return next;
}
