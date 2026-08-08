import type { ExecutionContext } from "./execution-context";
import {
  FSRS_DESIRED_RETENTION,
  FSRS_PARAMETERS_VERSION,
  FSRS_SCHEDULER_VERSION,
} from "@/lib/srs/fsrs-schedule";
import { saveAttemptBundle } from "./queries";
import { deriveObservations, derivePlacements } from "./verification/policy";
import type {
  AttemptAssessment,
  AttemptEventType,
  AttemptLog,
  LearningItem,
  SrsReviewEvent,
} from "./verification/types";

const FSRS_AUDIT = {
  schedulerVersion: FSRS_SCHEDULER_VERSION,
  parametersVersion: FSRS_PARAMETERS_VERSION,
  desiredRetention: FSRS_DESIRED_RETENTION,
} as const;

export interface AttemptRecordInput {
  wordId: string;
  sessionId: string;
  assessment: AttemptAssessment;
  eventType: AttemptEventType;
  currentItems: LearningItem[];
  retrievabilityBeforeReview?: number;
}

export interface AttemptRecordPlan {
  attemptLog: AttemptLog;
  srsEvents: SrsReviewEvent[];
  updatedItems: LearningItem[];
}

/**
 * Plans one immutable pedagogical interaction and its per-item SRS effects.
 * Practice interactions retain evidence but do not modify a schedule.
 * FSRS learning steps do affect their schedule, but remain distinguishable
 * from scheduled Review attempts for retention measurement.
 */
export function planAttemptRecord(
  input: AttemptRecordInput,
  context: ExecutionContext,
): AttemptRecordPlan {
  const occurredAt = context.now.toISOString();
  const observations = deriveObservations(input.assessment, context.now);
  const attemptLog: AttemptLog = {
    id: context.newId(),
    sessionId: input.sessionId,
    wordId: input.wordId,
    assessment: input.assessment,
    observations,
    eventType: input.eventType,
    occurredAt,
  };

  if (input.eventType === "practice") {
    return { attemptLog, srsEvents: [], updatedItems: [] };
  }

  const currentBySkill = new Map(input.currentItems.map((item) => [item.skill, item]));
  const placements = derivePlacements(observations, input.assessment, input.currentItems, context.now);
  const updatedItems = placements.flatMap((placement) => {
    const current = currentBySkill.get(placement.skill);
    if (!current) return [];

    return [{
      ...current,
      schedule: placement.schedule,
      lastReview: occurredAt,
      repetitions: current.repetitions + 1,
      lapses: current.lapses + (input.assessment.grade === "Again" ? 1 : 0),
    }];
  });
  const priorById = new Map(input.currentItems.map((item) => [item.id, item.schedule]));
  const srsEvents: SrsReviewEvent[] = updatedItems.map((item) => ({
    id: context.newId(),
    attemptLogId: attemptLog.id,
    learningItemId: item.id,
    grade: input.assessment.grade,
    assessment: input.assessment,
    priorSchedule: priorById.get(item.id)!,
    resultingSchedule: item.schedule,
    occurredAt,
    affectsSchedule: true,
    fsrsAudit: {
      ...FSRS_AUDIT,
      ...(input.retrievabilityBeforeReview === undefined
        ? {}
        : { retrievabilityBeforeReview: input.retrievabilityBeforeReview }),
    },
  }));

  return { attemptLog, srsEvents, updatedItems };
}

/** Persists the already-planned bundle atomically without generating new IDs. */
export async function persistAttemptRecord(
  userId: string,
  plan: AttemptRecordPlan,
): Promise<void> {
  await saveAttemptBundle(userId, {
    attempt: plan.attemptLog,
    events: plan.srsEvents,
    updatedItems: plan.updatedItems,
  });
}
