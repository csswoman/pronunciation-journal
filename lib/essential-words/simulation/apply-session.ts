import type { AttemptOutcome } from "../attempt-grade";
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
import { answerCorrectly, type SimulationProfile } from "./profiles";
import type { RandomSource } from "./random";
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
}

export interface AppliedSessionSummary {
  completedSeconds: number;
  newWords: number;
  baseSkillActivations: number;
  usageActivations: number;
  scheduledReviews: number;
  correctScheduledReviews: number;
}

function simulatedOutcome(
  item: PlannedItem,
  profile: SimulationProfile,
  durationMs: number,
  random: RandomSource,
): { outcome: AttemptOutcome; freeAudioReplays: number } {
  const correct = answerCorrectly(profile, item.modality, random);
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

export function completePlannedSession(
  queue: PlannedItem[],
  profile: SimulationProfile,
  costs: Record<AttemptModality, number>,
  budgetSeconds: number,
  random: RandomSource,
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

    const { outcome, freeAudioReplays } = simulatedOutcome(
      item,
      profile,
      durationMs,
      random,
    );
    completions.push({
      item,
      assessment: buildAssessment(outcome, item.modality, {
        interactionDurationMs: durationMs,
        freeAudioReplays,
      }),
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
  return item.schedule.kind === "fsrs" ? "scheduled-review" : "verification";
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
  let newWords = 0;
  let baseSkillActivations = 0;
  let usageActivations = 0;
  let scheduledReviews = 0;
  let correctScheduledReviews = 0;

  for (const completion of completions) {
    const word = world.words.get(completion.item.wordId);
    if (!word) throw new Error(`missing simulated word: ${completion.item.wordId}`);
    const currentItems = itemsObservedBy(completion.item, word);
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
