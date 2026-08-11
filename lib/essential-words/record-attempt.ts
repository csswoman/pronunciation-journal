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
  Skill,
  SkillObservation,
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
  renderedMode?: AttemptLog["renderedMode"];
  diagnostic?: AttemptLog["diagnostic"];
  observations?: SkillObservation[];
  assessmentsBySkill?: Partial<Record<Skill, AttemptAssessment>>;
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
  const observations = input.observations ?? deriveObservations(input.assessment, context.now);
  const attemptLog: AttemptLog = {
    id: context.newId(),
    sessionId: input.sessionId,
    wordId: input.wordId,
    assessment: input.assessment,
    observations,
    eventType: input.eventType,
    occurredAt,
    ...(input.renderedMode ? { renderedMode: input.renderedMode } : {}),
    ...(input.diagnostic ? { diagnostic: input.diagnostic } : {}),
  };

  if (input.eventType === "practice") {
    return { attemptLog, srsEvents: [], updatedItems: [] };
  }

  const currentBySkill = new Map(input.currentItems.map((item) => [item.skill, item]));
  const placements = observations.flatMap((observation) => {
    const assessment = input.assessmentsBySkill?.[observation.skill] ?? input.assessment;
    return derivePlacements([observation], assessment, input.currentItems, context.now)
      .map((placement) => ({ placement, assessment }));
  });
  const updatedItems = placements.flatMap(({ placement, assessment }) => {
    const current = currentBySkill.get(placement.skill);
    if (!current) return [];

    return [{
      ...current,
      schedule: placement.schedule,
      lastReview: occurredAt,
      repetitions: current.repetitions + 1,
      lapses: current.lapses + (assessment.grade === "Again" ? 1 : 0),
    }];
  });
  const priorById = new Map(input.currentItems.map((item) => [item.id, item.schedule]));
  const assessmentByItemId = new Map(placements.map(({ placement, assessment }) => [
    currentBySkill.get(placement.skill)?.id,
    assessment,
  ]));
  const srsEvents: SrsReviewEvent[] = updatedItems.map((item) => ({
    id: context.newId(),
    attemptLogId: attemptLog.id,
    learningItemId: item.id,
    grade: assessmentByItemId.get(item.id)?.grade ?? input.assessment.grade,
    assessment: assessmentByItemId.get(item.id) ?? input.assessment,
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
  seedItems: LearningItem[] = [],
): Promise<void> {
  await saveAttemptBundle(userId, {
    attempt: plan.attemptLog,
    events: plan.srsEvents,
    updatedItems: plan.updatedItems,
    seedItems,
  });
}
