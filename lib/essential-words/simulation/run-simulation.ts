import {
  DEFAULT_SECONDS_BY_MODALITY,
} from "../cost-estimate";
import { planDailySession } from "../daily-budget";
import type { ActivationLimits, DailyPlanningInput } from "../planning-types";
import { backlogSeconds, DEFAULT_RECOVERY_POLICY } from "../recovery-mode";
import { buildSkillQueue } from "../skill-queue";
import type {
  AttemptLog,
  AttemptModality,
  SrsReviewEvent,
} from "../verification/types";
import {
  applyCompletedSession,
  completePlannedSession,
} from "./apply-session";
import { collectCandidates, collectMandatory } from "./candidates";
import {
  buildPracticeCalendar,
  type SimulationProfile,
} from "./profiles";
import { seededRandom } from "./random";
import {
  applyInferenceConversions,
  countSimulationWorld,
  createInitialWorld,
  simulationContext,
  type SimulationOptions,
  type SimulationWorld,
  type SimulationWorldCounts,
} from "./state";

export const SIMULATION_COSTS: Record<AttemptModality, number> = {
  ...DEFAULT_SECONDS_BY_MODALITY,
};
export const SIMULATION_NEW_WORD_INTRODUCTION_SECONDS = 10;
export const SIMULATION_ACTIVATION_LIMITS: ActivationLimits = {
  maxBaseSkillActivationsPerSession: 2,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

export interface SimulatedDay {
  date: string;
  active: boolean;
  plannedSeconds: number;
  completedSeconds: number;
  plannedItems: number;
  completedItems: number;
  mandatorySelected: number;
  deferredMandatory: number;
  backlogSeconds: number;
  mode: "normal" | "recovery";
  newWords: number;
  baseSkillActivations: number;
  newWordMeaningActivations: number;
  usageActivations: number;
  provisionalDue: number;
  placementConversions: number;
  scheduledReviews: number;
  correctScheduledReviews: number;
  oldestDeferredAgeSessions: number;
  listeningEligibleWaiting: number;
  productionEligibleWaiting: number;
}

export interface SimulationResult {
  days: SimulatedDay[];
  world: SimulationWorld;
  worldCounts: SimulationWorldCounts;
  attemptLogs: AttemptLog[];
  srsEvents: SrsReviewEvent[];
  maxDeferredAgeSessions: number;
}

function dateAtDay(start: Date, dayIndex: number): Date {
  return new Date(start.getTime() + dayIndex * 86_400_000);
}

function oldestDeferredAge(world: SimulationWorld): number {
  return Math.max(
    0,
    ...[...world.deferred.values()].map((state) => (
      world.sessionIndex - state.firstDeferredSession
    )),
  );
}

function waitingBaseCounts(
  world: SimulationWorld,
  profile: SimulationProfile,
  now: Date,
  seed: number,
): { listening: number; production: number } {
  const candidates = collectCandidates(
    world,
    profile,
    simulationContext(now, seed, { value: 0 }),
  ).baseSkillActivations;
  return {
    listening: candidates.filter((item) => item.skill === "listening").length,
    production: candidates.filter((item) => item.skill === "production").length,
  };
}

function assertNonTrivialDynamics(
  profile: SimulationProfile,
  options: SimulationOptions,
  result: SimulationResult,
  initialInferences: number,
): void {
  if (
    options.days >= 90
    && options.corpusSize > 0
    && options.targetNewWords > 0
    && !result.days.some((day) => day.baseSkillActivations > 0)
  ) throw new Error("simulation produced no base skill activations");

  if (profile.placementConfidence === "high" && initialInferences > 0 && options.days >= 30) {
    if (!result.days.some((day) => day.placementConversions > 0)) {
      throw new Error("simulation produced no placement conversions");
    }
    if (!result.days.some((day) => day.provisionalDue > 0)) {
      throw new Error("simulation produced no provisional reviews");
    }
  }
  if (
    profile.id === "advanced"
    && options.days >= 180
    && options.corpusSize > 0
    && !result.days.some((day) => day.usageActivations > 0)
  ) throw new Error("simulation produced no usage activations");
}

export function runSimulation(
  profile: SimulationProfile,
  options: SimulationOptions,
): SimulationResult {
  if (!Number.isInteger(options.days) || options.days < 0) {
    throw new Error("days must be a non-negative integer");
  }
  if (options.dailyBudgetSeconds <= 0) throw new Error("dailyBudgetSeconds must be positive");
  if (!Number.isInteger(options.targetNewWords) || options.targetNewWords < 0) {
    throw new Error("targetNewWords must be a non-negative integer");
  }
  const start = new Date(options.startAt);
  if (Number.isNaN(start.getTime())) throw new Error("startAt must be a valid date");

  const world = createInitialWorld(options, profile);
  const initialInferences = [...world.words.values()]
    .filter((word) => word.meaning.placementInference).length;
  const random = seededRandom(options.seed);
  const calendar = buildPracticeCalendar(profile, options.days, random);
  const idCounter = { value: 0 };
  const days: SimulatedDay[] = [];

  for (let dayIndex = 0; dayIndex < options.days; dayIndex += 1) {
    const now = dateAtDay(start, dayIndex);
    const date = now.toISOString();
    const context = simulationContext(now, options.seed, idCounter);
    const mandatory = collectMandatory(world, now);
    const backlog = backlogSeconds(mandatory, SIMULATION_COSTS);
    let candidates = collectCandidates(world, profile, context);

    if (!calendar[dayIndex]) {
      const waiting = waitingBaseCounts(world, profile, now, options.seed);
      days.push({
        date, active: false, plannedSeconds: 0, completedSeconds: 0,
        plannedItems: 0, completedItems: 0, mandatorySelected: 0,
        deferredMandatory: world.deferred.size, backlogSeconds: backlog,
        mode: world.previousMode, newWords: 0, baseSkillActivations: 0,
        newWordMeaningActivations: 0, usageActivations: 0,
        provisionalDue: mandatory.provisionalDue.length, placementConversions: 0,
        scheduledReviews: 0, correctScheduledReviews: 0,
        oldestDeferredAgeSessions: oldestDeferredAge(world),
        listeningEligibleWaiting: waiting.listening,
        productionEligibleWaiting: waiting.production,
      });
      continue;
    }

    const placementConversions = applyInferenceConversions(
      world,
      candidates.inferredConversions,
      date,
    );
    candidates = collectCandidates(world, profile, context);
    const planningInput: DailyPlanningInput = {
      dailyBudgetSeconds: options.dailyBudgetSeconds,
      mandatory,
      candidates: {
        baseSkillActivations: candidates.baseSkillActivations,
        usageActivations: candidates.usageActivations,
        newWords: candidates.newWords.slice(0, options.targetNewWords),
      },
      estimatedSeconds: {
        byModality: SIMULATION_COSTS,
        newWordIntroduction: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
      },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: world.previousMode,
    };
    const plan = planDailySession(
      planningInput,
      SIMULATION_ACTIVATION_LIMITS,
      DEFAULT_RECOVERY_POLICY,
    );
    const queue = buildSkillQueue({ plan });
    const completions = completePlannedSession(
      queue,
      profile,
      SIMULATION_COSTS,
      options.dailyBudgetSeconds,
      random,
    );
    const summary = applyCompletedSession(
      world,
      plan,
      completions,
      context,
      context.newId(),
    );
    const waiting = waitingBaseCounts(world, profile, now, options.seed);

    days.push({
      date, active: true, plannedSeconds: plan.allowance.plannedSeconds,
      completedSeconds: summary.completedSeconds, plannedItems: queue.length,
      completedItems: completions.length,
      mandatorySelected: plan.mandatorySelected.length,
      deferredMandatory: world.deferred.size, backlogSeconds: backlog,
      mode: plan.allowance.mode, newWords: summary.newWords,
      baseSkillActivations: summary.baseSkillActivations,
      newWordMeaningActivations: summary.newWords,
      usageActivations: summary.usageActivations,
      provisionalDue: mandatory.provisionalDue.length,
      placementConversions,
      scheduledReviews: summary.scheduledReviews,
      correctScheduledReviews: summary.correctScheduledReviews,
      oldestDeferredAgeSessions: oldestDeferredAge(world),
      listeningEligibleWaiting: waiting.listening,
      productionEligibleWaiting: waiting.production,
    });
  }

  const result: SimulationResult = {
    days,
    world,
    worldCounts: countSimulationWorld(world),
    attemptLogs: world.attemptLogs,
    srsEvents: world.srsEvents,
    maxDeferredAgeSessions: Math.max(0, ...days.map((day) => day.oldestDeferredAgeSessions)),
  };
  assertNonTrivialDynamics(profile, options, result, initialInferences);
  return result;
}
