"use client";

import { getUserLearningState } from "@/lib/ai-practice/load-state";
import { persistLearningState } from "@/lib/ai-practice/queries";
import type { UserLearningState } from "@/lib/ai-practice/learning-state";
import type { ConceptSignal } from "@/lib/courses/concept-profile";
import type { CefrLevel } from "@/lib/essential-words/types";
import { db } from "@/lib/db";
import {
  accumulateConceptSignal,
  isConceptEvidenceReplay,
} from "@/lib/progress/concept-evidence";

export function mergeConceptSignals(
  existing: readonly ConceptSignal[],
  incoming: readonly ConceptSignal[],
): ConceptSignal[] {
  const byLesson = new Map(existing.map((signal) => [signal.lessonSlug, signal]));

  for (const signal of incoming) {
    const previous = byLesson.get(signal.lessonSlug);

    // Exercise evidence accumulates by unique attempt and content (plan 050);
    // replays and out-of-order offline sessions converge to the same state.
    if (signal.evidence) {
      const accumulated = accumulateConceptSignal(previous, signal);
      const keepNewerManual = previous?.source === "manual"
        && signal.assessedAt < previous.assessedAt;
      byLesson.set(
        signal.lessonSlug,
        keepNewerManual ? { ...previous, evidence: accumulated.evidence } : accumulated,
      );
      continue;
    }

    if (!previous) {
      byLesson.set(signal.lessonSlug, signal);
      continue;
    }

    // Manual signal incoming always wins; accumulated evidence is history, not
    // a claim, so it is carried forward instead of discarded.
    if (signal.source === "manual") {
      byLesson.set(signal.lessonSlug, withCarriedEvidence(signal, previous));
      continue;
    }

    // If previous was manual, it is preserved unless incoming has real quiz/exercise evidence (total > 0)
    if (previous.source === "manual") {
      const hasRealEvidence = signal.total > 0;
      if (hasRealEvidence && signal.assessedAt >= previous.assessedAt) {
        byLesson.set(signal.lessonSlug, withCarriedEvidence(signal, previous));
      }
      continue;
    }

    if (signal.assessedAt >= previous.assessedAt) {
      byLesson.set(signal.lessonSlug, withCarriedEvidence(signal, previous));
    }
  }

  return [...byLesson.values()].sort((a, b) =>
    a.level.localeCompare(b.level) || a.lessonSlug.localeCompare(b.lessonSlug)
  );
}

function withCarriedEvidence(signal: ConceptSignal, previous: ConceptSignal): ConceptSignal {
  return previous.evidence ? {
    ...signal, evidence: previous.evidence,
    ...(previous.masteryBySkill ? { masteryBySkill: previous.masteryBySkill } : {}),
  } : signal;
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
  // The remote fallback cannot run inside an IndexedDB transaction.
  const remoteBase = (await db.learningState.get(userId))
    ? null
    : await getUserLearningState(userId);

  // Read-merge-write in one transaction so two tabs never overwrite each
  // other's concept evidence locally. Remote user_learning_state is still a
  // whole-JSON last-writer-wins snapshot (documented limit, plan 050).
  return db.transaction("rw", [db.learningState, db.syncOutbox], async () => {
    const local = await db.learningState.get(userId);
    const base = local?.state ?? remoteBase;
    if (!base) throw new Error("learning state disappeared during concept update");
    const updatedAt = new Date().toISOString();
    const existing = base.theory?.concepts ?? [];
    const previousBySlug = new Map(existing.map((signal) => [signal.lessonSlug, signal]));

    // Real evidence (source: 'exercise') doubles as "what was studied today" —
    // manual claims don't, since asking for help isn't a completed session.
    // A replayed session adds no new attempts and no new entry.
    const newSessions = conceptSignals
      .filter((s) => s.source === "exercise" && s.total > 0)
      .filter((s) => !isConceptEvidenceReplay(previousBySlug.get(s.lessonSlug), s))
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
        concepts: mergeConceptSignals(existing, conceptSignals),
      },
      lastSessions: [...newSessions, ...base.lastSessions].slice(0, 10),
    };

    await persistLearningState(userId, next);
    return next;
  });
}
