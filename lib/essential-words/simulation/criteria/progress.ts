import type { ItemSchedule } from "../../verification/types";
import type { SimulatedDay } from "../run-simulation";
import type { CriterionResult } from "./load";

export interface EligibilityObservation {
  itemId: string;
  skill: "listening" | "production";
  sessionIndex: number;
  eligible: boolean;
  scheduleKind: ItemSchedule["kind"];
  cumulativeAvailableSeconds: number;
}

export interface DeferredObservation {
  itemId: string;
  sessionIndex: number;
  tranche: "learning" | "overdue" | "dueToday" | "provisionalDue";
  dueAt: string;
  eligible: boolean;
  selected: boolean;
  suspended: boolean;
}

export function usageActivationShare(
  days: SimulatedDay[],
  windowSessions: number,
  minimumDenominator: number,
  maximumShare: number,
): CriterionResult {
  const sessions = days.filter((day) => day.active);
  const shares: number[] = [];
  for (let end = windowSessions; end <= sessions.length; end += 1) {
    const window = sessions.slice(end - windowSessions, end);
    const usage = window.reduce((total, day) => total + day.usageActivations, 0);
    const denominator = window.reduce((total, day) => (
      total
      + day.baseSkillActivations
      + day.newWordMeaningActivations
      + day.usageActivations
    ), 0);
    if (denominator >= minimumDenominator) shares.push(usage / denominator);
  }
  const measured = shares.length > 0 ? Math.max(...shares) : null;
  return {
    passed: measured === null || measured <= maximumShare,
    name: "usage-activation-share",
    measured,
    limit: maximumShare,
    detail: measured === null
      ? `no ${windowSessions}-session window reached denominator ${minimumDenominator}`
      : `maximum share across ${shares.length} eligible windows`,
  };
}

export function newWordLiveness(
  days: SimulatedDay[],
  targetNewWords: number,
): CriterionResult {
  const eligible = days.filter((day) => (
    day.active
    && day.mode === "normal"
    && day.backlogSeconds < day.dailyBudgetSeconds * 0.8
  ));
  if (eligible.length === 0) {
    return {
      passed: true,
      name: "new-word-liveness",
      measured: null,
      limit: 0.6,
      detail: "no low-pressure normal sessions",
    };
  }
  const target = eligible.length * targetNewWords;
  const introduced = eligible.reduce((total, day) => total + day.newWords, 0);
  const measured = target === 0 ? 1 : introduced / target;
  return {
    passed: measured >= 0.6,
    name: "new-word-liveness",
    measured,
    limit: 0.6,
    detail: `${introduced}/${target} target words introduced in ${eligible.length} eligible sessions`,
  };
}

interface WaitingResult {
  maximum: number;
  itemId?: string;
}

function maximumEligibilityWait(
  observations: EligibilityObservation[],
): WaitingResult {
  const byItem = new Map<string, EligibilityObservation[]>();
  for (const observation of observations) {
    const group = byItem.get(observation.itemId) ?? [];
    group.push(observation);
    byItem.set(observation.itemId, group);
  }

  let result: WaitingResult = { maximum: 0 };
  for (const [itemId, group] of byItem) {
    let waiting = 0;
    let budgetReached = false;
    for (const observation of group.sort((left, right) => left.sessionIndex - right.sessionIndex)) {
      if (!observation.eligible || observation.scheduleKind !== "none") {
        waiting = 0;
        budgetReached = false;
        continue;
      }
      budgetReached ||= observation.cumulativeAvailableSeconds > 0;
      if (budgetReached) waiting += 1;
      if (waiting > result.maximum) result = { maximum: waiting, itemId };
    }
  }
  return result;
}

export function baseSkillActivationLiveness(
  observations: EligibilityObservation[],
  maximumWaitingSessions: number,
): CriterionResult {
  const listening = maximumEligibilityWait(
    observations.filter((observation) => observation.skill === "listening"),
  );
  const production = maximumEligibilityWait(
    observations.filter((observation) => observation.skill === "production"),
  );
  const measured = Math.max(listening.maximum, production.maximum);
  const offender = listening.maximum >= production.maximum ? listening : production;
  return {
    passed: measured <= maximumWaitingSessions,
    name: "base-skill-activation-liveness",
    measured,
    limit: maximumWaitingSessions,
    detail: `listening=${listening.maximum}; production=${production.maximum}`
      + (offender.itemId ? `; oldest=${offender.itemId}` : ""),
  };
}

interface DeferredWait {
  age: number;
  observation?: DeferredObservation;
}

export function noOverdueStarvation(
  observations: DeferredObservation[],
  maximumWaitingSessions: number,
): CriterionResult {
  const byItem = new Map<string, DeferredObservation[]>();
  for (const observation of observations) {
    const group = byItem.get(observation.itemId) ?? [];
    group.push(observation);
    byItem.set(observation.itemId, group);
  }

  let oldest: DeferredWait = { age: 0 };
  for (const group of byItem.values()) {
    let age = 0;
    for (const observation of group.sort((left, right) => left.sessionIndex - right.sessionIndex)) {
      if (observation.suspended || !observation.eligible || observation.selected) {
        age = 0;
        continue;
      }
      age += 1;
      if (age > oldest.age) oldest = { age, observation };
    }
  }

  const detail = oldest.observation
    ? `${oldest.observation.itemId}; tranche=${oldest.observation.tranche}; `
      + `dueAt=${oldest.observation.dueAt}; age=${oldest.age}`
    : "no eligible deferred items";
  return {
    passed: oldest.age <= maximumWaitingSessions,
    name: "no-overdue-starvation",
    measured: oldest.age,
    limit: maximumWaitingSessions,
    detail,
  };
}
