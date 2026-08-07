import {
  DEFAULT_SECONDS_BY_MODALITY,
  estimateItemsSeconds,
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
import {
  collectCandidates,
  collectMandatory,
} from "./candidates";
import type {
  DeferredObservation,
  EligibilityObservation,
} from "./criteria";
import {
  createEligibilityAccumulator,
  dateAtDay,
  findNonTrivialFailures,
  observeDeferred,
  observeEligibility,
  oldestDeferredAge,
  waitingBaseCounts,
  type SimulationHarnessHooks,
  type SimulationHookContext,
} from "./observations";
import {
  buildPracticeCalendar,
  type SimulationProfile,
} from "./profiles";
import { seededRandom } from "./random";
import {
  applyInferenceConversions,
  countSimulationWorld,
  createInitialWorld,
  findWordItem,
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
  dailyBudgetSeconds: number;
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
  eligibility: EligibilityObservation[];
  deferredObservations: DeferredObservation[];
  nonTrivialFailures: string[];
  maxDeferredAgeSessions: number;
  options: SimulationOptions;
}

export type { SimulationHarnessHooks, SimulationHookContext } from "./observations";

export function runSimulation(
  profile: SimulationProfile,
  options: SimulationOptions,
  hooks: SimulationHarnessHooks = {},
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
  const eligibility: EligibilityObservation[] = [];
  const deferredObservations: DeferredObservation[] = [];
  const eligibilityAccumulator = createEligibilityAccumulator();
  let sawPlacementProvisionalDue = false;

  for (let dayIndex = 0; dayIndex < options.days; dayIndex += 1) {
    const now = dateAtDay(start, dayIndex);
    const date = now.toISOString();
    const context = simulationContext(now, options.seed, idCounter);
    const hookContext: SimulationHookContext = { dayIndex, now, world, options };
    let mandatory = collectMandatory(world, now);
    mandatory = hooks.mutateMandatory?.(mandatory, hookContext) ?? mandatory;
    sawPlacementProvisionalDue ||= mandatory.provisionalDue.some((planned) => {
      const word = world.words.get(planned.wordId);
      const item = word ? findWordItem(word, planned.itemId) : undefined;
      return item?.schedule.kind === "provisional"
        && item.schedule.source === "placement-inference";
    });
    const backlog = backlogSeconds(mandatory, SIMULATION_COSTS);
    let candidates = collectCandidates(world, profile, context);
    candidates = hooks.mutateCandidates?.(candidates, hookContext) ?? candidates;

    if (!calendar[dayIndex]) {
      const waiting = waitingBaseCounts(world, profile, now, options.seed);
      days.push({
        date, active: false, dailyBudgetSeconds: options.dailyBudgetSeconds,
        plannedSeconds: 0, completedSeconds: 0,
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
    candidates = hooks.mutateCandidates?.(candidates, hookContext) ?? candidates;
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
    let plan = planDailySession(
      planningInput,
      SIMULATION_ACTIVATION_LIMITS,
      DEFAULT_RECOVERY_POLICY,
    );
    plan = hooks.mutatePlan?.(plan, mandatory, hookContext) ?? plan;
    const queue = buildSkillQueue({ plan });
    let completions = completePlannedSession(
      queue,
      profile,
      SIMULATION_COSTS,
      options.dailyBudgetSeconds,
      random,
    );
    completions = hooks.mutateCompletions?.(completions, hookContext) ?? completions;
    const sessionIndex = world.sessionIndex;
    const summary = applyCompletedSession(
      world,
      plan,
      completions,
      context,
      context.newId(),
    );
    const availableSeconds = Math.max(
      0,
      options.dailyBudgetSeconds
        - estimateItemsSeconds(plan.mandatorySelected, SIMULATION_COSTS),
    );
    eligibility.push(...observeEligibility(
      world,
      sessionIndex,
      availableSeconds,
      eligibilityAccumulator,
    ));
    deferredObservations.push(...observeDeferred(mandatory, plan, sessionIndex));
    const waiting = waitingBaseCounts(world, profile, now, options.seed);

    let simulatedDay: SimulatedDay = {
      date, active: true, dailyBudgetSeconds: options.dailyBudgetSeconds,
      plannedSeconds: plan.allowance.plannedSeconds,
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
    };
    simulatedDay = hooks.mutateDay?.(simulatedDay, hookContext) ?? simulatedDay;
    days.push(simulatedDay);
  }

  const nonTrivialFailures = findNonTrivialFailures(
    profile,
    options,
    days,
    initialInferences,
    sawPlacementProvisionalDue,
  );
  const result: SimulationResult = {
    days,
    world,
    worldCounts: countSimulationWorld(world),
    attemptLogs: world.attemptLogs,
    srsEvents: world.srsEvents,
    eligibility,
    deferredObservations,
    nonTrivialFailures,
    maxDeferredAgeSessions: Math.max(0, ...days.map((day) => day.oldestDeferredAgeSessions)),
    options: { ...options },
  };
  if (!hooks.allowTrivialDynamics && nonTrivialFailures.length > 0) {
    throw new Error(`simulation produced trivial dynamics: ${nonTrivialFailures.join(", ")}`);
  }
  return result;
}
