import type { DailyPlan } from "../planning-types";
import type { SimulatedCompletion } from "./apply-session";
import type {
  DeferredObservation,
  EligibilityObservation,
} from "./criteria";
import {
  collectCandidates,
  type SimulationCandidates,
  type SimulationMandatory,
} from "./candidates";
import type { SimulationProfile } from "./profiles";
import type { SimulatedDay } from "./run-simulation";
import {
  simulationContext,
  type SimulationOptions,
  type SimulationWorld,
} from "./state";

export interface SimulationHookContext {
  dayIndex: number;
  now: Date;
  world: SimulationWorld;
  options: SimulationOptions;
}

export interface SimulationHarnessHooks {
  mutateMandatory?(
    mandatory: SimulationMandatory,
    context: SimulationHookContext,
  ): SimulationMandatory;
  mutateCandidates?(
    candidates: SimulationCandidates,
    context: SimulationHookContext,
  ): SimulationCandidates;
  mutatePlan?(
    plan: DailyPlan,
    mandatory: SimulationMandatory,
    context: SimulationHookContext,
  ): DailyPlan;
  mutateCompletions?(
    completions: SimulatedCompletion[],
    context: SimulationHookContext,
  ): SimulatedCompletion[];
  mutateDay?(day: SimulatedDay, context: SimulationHookContext): SimulatedDay;
  allowTrivialDynamics?: boolean;
}

export interface EligibilityAccumulator {
  availableSecondsByItem: Map<string, number>;
}

export function createEligibilityAccumulator(): EligibilityAccumulator {
  return { availableSecondsByItem: new Map() };
}

export function observeEligibility(
  world: SimulationWorld,
  sessionIndex: number,
  availableSeconds: number,
  accumulator: EligibilityAccumulator,
  dailyBudgetSeconds?: number,
): EligibilityObservation[] {
  const observations: EligibilityObservation[] = [];
  for (const word of world.words.values()) {
    if (!word.introducedAt || word.meaning.schedule.kind === "none") continue;
    const skills = [
      { item: word.listening, eligible: true },
      {
        item: word.production,
        eligible: word.listening.schedule.kind !== "none",
      },
    ] as const;

    for (const { item, eligible } of skills) {
      if (!eligible || item.suspended || item.schedule.kind !== "none") continue;
      const cumulative = (accumulator.availableSecondsByItem.get(item.id) ?? 0)
        + availableSeconds;
      accumulator.availableSecondsByItem.set(item.id, cumulative);
      observations.push({
        itemId: item.id,
        skill: item.skill,
        sessionIndex,
        eligible: true,
        scheduleKind: "none",
        cumulativeAvailableSeconds: cumulative,
        sessionAvailableSeconds: availableSeconds,
        sessionDailyBudgetSeconds: dailyBudgetSeconds,
      });
    }
  }
  return observations;
}

export function observeDeferred(
  mandatory: SimulationMandatory,
  plan: DailyPlan,
  sessionIndex: number,
): DeferredObservation[] {
  const selected = new Set(plan.mandatorySelected.map((item) => item.itemId));
  const tranches = [
    ["learning", mandatory.learning],
    ["overdue", mandatory.overdue],
    ["dueToday", mandatory.dueToday],
    ["provisionalDue", mandatory.provisionalDue],
  ] as const;

  return tranches.flatMap(([tranche, items]) => items.map((item) => ({
    itemId: item.itemId,
    sessionIndex,
    tranche,
    dueAt: item.dueAt,
    eligible: true,
    selected: selected.has(item.itemId),
    suspended: false,
  })));
}

export function dateAtDay(start: Date, dayIndex: number): Date {
  return new Date(start.getTime() + dayIndex * 86_400_000);
}

export function oldestDeferredAge(world: SimulationWorld): number {
  return Math.max(
    0,
    ...[...world.deferred.values()].map((state) => (
      world.sessionIndex - state.firstDeferredSession
    )),
  );
}

export function waitingBaseCounts(
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

export function findNonTrivialFailures(
  profile: SimulationProfile,
  options: SimulationOptions,
  days: SimulatedDay[],
  initialInferences: number,
  sawPlacementProvisionalDue: boolean,
): string[] {
  const failures: string[] = [];
  if (
    options.days >= 90
    && options.corpusSize > 0
    && options.targetNewWords > 0
    && !days.some((day) => day.baseSkillActivations > 0)
  ) failures.push("base-skill-activations");

  if (profile.placementConfidence === "high" && initialInferences > 0 && options.days >= 30) {
    if (!days.some((day) => day.placementConversions > 0)) {
      failures.push("placement-conversions");
    }
    if (!sawPlacementProvisionalDue) failures.push("provisional-due");
  }
  if (
    profile.id === "advanced"
    && options.days >= 180
    && options.corpusSize > 0
    && !days.some((day) => day.usageActivations > 0)
  ) failures.push("usage-activations");
  return failures;
}
