import type { ExecutionContext } from "../execution-context";
import type { DailyPlan, PlannedItem } from "../planning-types";
import {
  planAttemptRecord,
  type AttemptRecordPlan,
} from "../record-attempt";
import { buildAssessment } from "../verification/assessment";
import type {
  AttemptAssessment,
  AttemptEventType,
  AttemptModality,
  LearningItem,
} from "../verification/types";
import type { BaseLearningItem } from "./fixtures";
import type { SimulationProfile } from "./profiles";
import type { RandomSource } from "./random";
import {
  simulateScheduledReviewOutcome,
  type SimulatedScheduledReview,
} from "./scheduled-review-outcome";
import { simulateAttemptOutcome } from "./simulated-outcome";
import { updateSimulationCapacityReservations } from "./capacity-state";
import {
  findWordItem,
  replaceWorldItem,
  updateSimulationDeferred,
  type SimulationWorld,
  type SimulatedWordState,
} from "./state";

export interface SimulatedCompletion {
  item: PlannedItem;
  assessment: AttemptAssessment;
  scheduledReview?: SimulatedScheduledReview;
}

export interface SimulationReviewContext {
  now: Date;
  resolveItem(item: PlannedItem): LearningItem | undefined;
}

export interface AppliedSessionSummary {
  completedSeconds: number;
  newWords: number;
  baseSkillActivations: number;
  usageActivations: number;
  scheduledReviews: number;
  correctScheduledReviews: number;
}

export function completePlannedSession(
  queue: PlannedItem[],
  profile: SimulationProfile,
  costs: Record<AttemptModality, number>,
  budgetSeconds: number,
  random: RandomSource,
  reviewContext?: SimulationReviewContext,
): SimulatedCompletion[] {
  const completions: SimulatedCompletion[] = [];
  const completionBudgetMs = budgetSeconds * profile.completionBudgetRatio * 1_000;
  let consumedMs = 0;

  for (const item of queue) {
    const durationMs = Math.max(
      1_000,
      Math.round(costs[item.modality] * 1_000 * (0.8 + random.next() * 0.4)),
    );
    if (completions.length > 0 && consumedMs + durationMs > completionBudgetMs) break;

    const scheduled = reviewContext
      ? (() => {
          const current = reviewContext.resolveItem(item);
          return current
            ? simulateScheduledReviewOutcome(current, reviewContext.now, random)
            : null;
        })()
      : null;
    const { outcome, freeAudioReplays } = simulateAttemptOutcome(
      item,
      profile,
      durationMs,
      random,
      scheduled?.recalled,
    );
    const assessment = buildAssessment(outcome, item.modality, {
      interactionDurationMs: durationMs,
      freeAudioReplays,
    });
    completions.push({
      item,
      assessment,
      ...(scheduled
        ? {
            scheduledReview: {
              ...scheduled,
              grade: assessment.grade,
              eventType: "scheduled-review" as const,
              affectsSchedule: true as const,
            },
          }
        : {}),
    });
    consumedMs += durationMs;
  }

  return completions;
}

export function itemsObservedBy(
  planned: PlannedItem,
  word: SimulatedWordState,
): LearningItem[] {
  if (planned.skill === "meaning") return [word.meaning];
  if (planned.skill === "listening") return [word.meaning, word.listening];
  if (planned.skill === "production") return [word.meaning, word.production];
  const usage = findWordItem(word, planned.itemId);
  if (!usage) throw new Error(`missing simulated usage item: ${planned.itemId}`);
  return [usage];
}

function eventTypeFor(item: LearningItem): AttemptEventType {
  if (item.schedule.kind !== "fsrs") return "verification";
  return item.schedule.state === "Review" ? "scheduled-review" : "learning-step";
}

function usageAttemptPlan(
  item: LearningItem,
  completion: SimulatedCompletion,
  sessionId: string,
  context: ExecutionContext,
): AttemptRecordPlan {
  const surrogate: BaseLearningItem<"production"> = {
    ...item,
    skill: "production",
    placementInference: undefined,
  };
  const plan = planAttemptRecord({
    wordId: item.wordId,
    sessionId,
    assessment: completion.assessment,
    eventType: eventTypeFor(item),
    currentItems: [surrogate],
    retrievabilityBeforeReview: completion.scheduledReview?.retrievability,
  }, context);
  const scheduled = plan.updatedItems[0];
  if (!scheduled || !item.payload) throw new Error("usage activation produced no schedule");

  return {
    attemptLog: {
      ...plan.attemptLog,
      observations: plan.attemptLog.observations
        .filter((observation) => observation.skill === "production")
        .map((observation) => ({ ...observation, skill: "usage" as const })),
    },
    srsEvents: plan.srsEvents,
    updatedItems: [{
      ...item,
      schedule: scheduled.schedule,
      lastReview: scheduled.lastReview,
      repetitions: scheduled.repetitions,
      lapses: scheduled.lapses,
      payload: {
        ...item.payload,
        activatedAt: item.payload.activatedAt ?? context.now.toISOString(),
      },
    }],
  };
}

export function applyAttemptRecordToWorld(
  world: SimulationWorld,
  plan: AttemptRecordPlan,
): void {
  world.attemptLogs.push(plan.attemptLog);
  world.srsEvents.push(...plan.srsEvents);
  for (const item of plan.updatedItems) replaceWorldItem(world, item);
}

export function applyCompletedSession(
  world: SimulationWorld,
  plan: DailyPlan,
  completions: SimulatedCompletion[],
  context: ExecutionContext,
  sessionId: string,
): AppliedSessionSummary {
  const completedIds = new Set<string>();
  const newWordIds = new Set(plan.newWordsSelected.map((item) => item.wordId));
  const baseIds = new Set(plan.baseSkillSelected.map((item) => item.itemId));
  const usageIds = new Set(plan.usageSelected.map((item) => item.itemId));
  /**
   * Task 8.9f — ownership fix. `itemsObservedBy` reprograma `meaning` como
   * efecto lateral de completar listening/production (legítimo cuando
   * meaning no tiene su propia completion esta sesión). Dos problemas
   * distintos pueden aplicar FSRS dos veces al mismo item en una sesión:
   * (a) meaning tiene su propia completion Y además un sibling la observa
   *     — su propia completion debe ser la única fuente, nunca un sibling;
   * (b) meaning NO tiene completion propia pero DOS siblings distintos la
   *     observan en la misma sesión (p.ej. listening con scheduled-review
   *     due hoy + production con activación base el mismo día) — sólo la
   *     PRIMERA observación debe aplicarse; la segunda partiría ya del
   *     resultingSchedule pisado por la primera, doble-contando growth.
   * `settledItemIds` arranca con todo lo que tendrá completion propia esta
   * sesión (reservado de antemano, sin importar el orden del loop) y crece
   * con cada item efectivamente observado, para que ningún item se asiente
   * más de una vez por sesión salvo por su propia completion.
   */
  const directlyCompletedItemIds = new Set(completions.map((completion) => completion.item.itemId));
  const settledItemIds = new Set(directlyCompletedItemIds);
  let newWords = 0;
  let baseSkillActivations = 0;
  let usageActivations = 0;
  let scheduledReviews = 0;
  let correctScheduledReviews = 0;

  for (const completion of completions) {
    const word = world.words.get(completion.item.wordId);
    if (!word) throw new Error(`missing simulated word: ${completion.item.wordId}`);
    const currentItems = itemsObservedBy(completion.item, word).filter((item) => (
      item.id === completion.item.itemId || !settledItemIds.has(item.id)
    ));
    for (const item of currentItems) settledItemIds.add(item.id);
    const current = findWordItem(word, completion.item.itemId);
    if (!current) throw new Error(`missing simulated item: ${completion.item.itemId}`);
    const record = completion.item.skill === "usage"
      ? usageAttemptPlan(current, completion, sessionId, context)
      : planAttemptRecord({
          wordId: word.wordId,
          sessionId,
          assessment: completion.assessment,
          eventType: eventTypeFor(current),
          currentItems,
          retrievabilityBeforeReview: completion.scheduledReview?.retrievability,
        }, context);

    applyAttemptRecordToWorld(world, record);
    completedIds.add(completion.item.itemId);
    if (record.attemptLog.eventType === "scheduled-review") {
      scheduledReviews += 1;
      if (completion.assessment.correct) correctScheduledReviews += 1;
    }
    if (newWordIds.has(word.wordId) && !word.introducedAt) {
      word.introducedAt = context.now.toISOString();
      world.introducedWords += 1;
      newWords += 1;
    }
    if (baseIds.has(completion.item.itemId)) baseSkillActivations += 1;
    if (usageIds.has(completion.item.itemId)) usageActivations += 1;
  }

  updateSimulationDeferred(world, plan, completedIds);
  updateSimulationCapacityReservations(world, plan, completedIds);
  world.previousMode = plan.allowance.mode;
  world.sessionIndex += 1;

  return {
    completedSeconds: completions.reduce(
      (total, completion) => total + completion.assessment.interactionDurationMs / 1_000,
      0,
    ),
    newWords,
    baseSkillActivations,
    usageActivations,
    scheduledReviews,
    correctScheduledReviews,
  };
}
