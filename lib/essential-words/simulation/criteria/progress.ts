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
  /**
   * Seconds left in *this* session after mandatory review/learning was
   * selected (`dailyBudgetSeconds - mandatorySelectedSeconds`), measured
   * before pending base/placement/new-words/usage spend any of it (Task
   * 8.9-final C9 reformulation, §6 — no gaming: this must be the real
   * post-mandatory state, never a value narrowed to make a session count or
   * not count). Optional so pre-existing fixtures default to "no data" (see
   * `hasServiceOpportunity`).
   */
  sessionAvailableSeconds?: number;
  sessionDailyBudgetSeconds?: number;
  /**
   * This skill's estimated cost in seconds (Task 8.9-final C9
   * reformulation, §5 — listening/production use their real, possibly
   * different, per-modality costs). Paired with `sessionAvailableSeconds`
   * to decide whether this session was a genuine service opportunity for
   * this item.
   */
  skillCostSeconds?: number;
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

/** Same horizon as C9 (`baseSkillActivationLiveness`'s deadline), for a single starvation clock. */
export const DEFAULT_CAPACITY_STARVATION_LIMIT_SESSIONS = 8;

export interface NewWordLivenessResult extends CriterionResult {
  /** Eligible sessions where capacitySafeNewWords >= ceil(target * 0.60). */
  highCapacitySessions: number;
  /** Eligible sessions where 0 < capacitySafeNewWords < ceil(target * 0.60). */
  lowCapacitySessions: number;
  /** Eligible sessions where capacitySafeNewWords === 0 (exempt entirely). */
  zeroCapacitySessions: number;
  /** Longest run of consecutive capacity>0 eligible sessions with 0 admitted. */
  longestStarvationRunSessions: number;
}

/**
 * C8, capacity-conditioned liveness (Task 8.9h proposal, approved as
 * Decisión 1 in Task 8.9i — see
 * docs/superpowers/plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md and
 * .../2026-08-07-fase8-9h-decision-record.md).
 *
 * `targetNewWords` stays a per-session maximum (already enforced upstream
 * by `configuredNewWordLimit`, `daily-budget.ts`), not a quota C8 must hit
 * in every steady state regardless of forecasted capacity:
 *
 *   when capacitySafeNewWords > 0:
 *     admission must make progress and must not starve.
 *   when capacitySafeNewWords >= ceil(target * 0.60):
 *     admittedNewWords must reach ceil(target * 0.60) in aggregate over
 *     those "high capacity" sessions.
 *   when capacitySafeNewWords < ceil(target * 0.60):
 *     do not fail for not admitting work the forecast already proved
 *     impossible — "low capacity" sessions are graded on liveness
 *     (starvation), not on hitting the nominal 60% target.
 *
 * `capacitySafeNewWords` must come from the full admission forecast
 * (`admission-control.ts::NewWordAdmissionResult.capacitySafeNewWords`,
 * `SimulatedDay.capacitySafeNewWords`) — this criterion does not, and must
 * not, recompute or narrow it; doing so would let C8 be satisfied by
 * artificially shrinking the reported capacity instead of by admitting
 * real work.
 */
export function newWordLiveness(
  days: SimulatedDay[],
  targetNewWords: number,
  starvationLimitSessions: number = DEFAULT_CAPACITY_STARVATION_LIMIT_SESSIONS,
): NewWordLivenessResult {
  const threshold = Math.ceil(targetNewWords * 0.6);
  const eligible = days.filter((day) => (
    day.active
    && day.mode === "normal"
    && day.backlogSeconds < day.dailyBudgetSeconds * 0.8
  ));

  const capacityOf = (day: SimulatedDay): number => day.capacitySafeNewWords ?? Infinity;
  const highCapacityDays = eligible.filter((day) => capacityOf(day) >= threshold);
  const lowCapacityDays = eligible.filter((day) => (
    capacityOf(day) > 0 && capacityOf(day) < threshold
  ));
  const zeroCapacityDays = eligible.filter((day) => capacityOf(day) === 0);
  const capacityPositiveDays = eligible.filter((day) => capacityOf(day) > 0);

  const admittedHigh = highCapacityDays.reduce((total, day) => total + day.newWords, 0);
  const requiredHigh = threshold * highCapacityDays.length;
  const highCapacityLive = highCapacityDays.length === 0 || admittedHigh >= requiredHigh;

  let longestStarvationRunSessions = 0;
  let currentRun = 0;
  for (const day of capacityPositiveDays) {
    if (day.newWords === 0) {
      currentRun += 1;
      longestStarvationRunSessions = Math.max(longestStarvationRunSessions, currentRun);
    } else {
      currentRun = 0;
    }
  }
  const noStarvation = longestStarvationRunSessions <= starvationLimitSessions;

  const passed = highCapacityLive && noStarvation;
  const detail = `high-capacity: ${admittedHigh}/${requiredHigh} over `
    + `${highCapacityDays.length} session(s); longest starvation run `
    + `${longestStarvationRunSessions}/${starvationLimitSessions} over `
    + `${capacityPositiveDays.length} capacity>0 session(s); low-capacity `
    + `${lowCapacityDays.length} session(s) exempt from the 60% target; `
    + `zero-capacity ${zeroCapacityDays.length} session(s) exempt entirely`;

  return {
    passed,
    name: "new-word-liveness",
    measured: requiredHigh === 0 ? null : admittedHigh / requiredHigh,
    limit: 0.6,
    detail,
    highCapacitySessions: highCapacityDays.length,
    lowCapacitySessions: lowCapacityDays.length,
    zeroCapacitySessions: zeroCapacityDays.length,
    longestStarvationRunSessions,
  };
}

interface WaitingResult {
  maximum: number;
  itemId?: string;
}

/**
 * C9, capacity-conditioned liveness by real service opportunities (Task
 * 8.9-final, replaces the 80/20 mandatory-saturation exemption — see
 * docs/superpowers/plans/notes/2026-08-08-fase8-c9-service-opportunity.md).
 *
 * A session is a service opportunity for a candidate only when, right after
 * mandatory selection and before pending-base/placement/new-words/usage
 * spend anything, there are enough seconds left to actually serve that
 * candidate's skill:
 *
 *   serviceOpportunity(candidate, session) =
 *     candidateIsEligible
 *     && sessionAvailableSeconds >= skillCostSeconds
 *
 * Sessions that are not opportunities (no data, inactive day, or genuinely
 * not enough time after mandatory) do not advance the starvation clock —
 * they also do not reset it. Mandatory keeps absolute priority: it is what
 * creates or removes an opportunity, never something reserved against
 * artificially to make this criterion pass. Lower-priority work (placement,
 * new words, usage) consuming an opportunity that pending base could have
 * used is exactly what SHOULD advance the clock — this function only reads
 * `sessionAvailableSeconds` as measured immediately after mandatory, so it
 * cannot tell the difference between "no time" and "time taken by lower
 * priority work" by construction, and that is intentional per §4 of the
 * encargo: both must count as an opportunity that was not used to serve the
 * oldest pending item.
 */
function hasServiceOpportunity(observation: EligibilityObservation): boolean {
  if (
    observation.sessionAvailableSeconds === undefined
    || observation.skillCostSeconds === undefined
  ) {
    // No opportunity data recorded (older fixtures) — do not count, do not
    // reset, consistent with "sessions without opportunity data are neutral".
    return false;
  }
  return observation.sessionAvailableSeconds >= observation.skillCostSeconds;
}

function maximumEligibilityWait(
  observations: EligibilityObservation[],
): WaitingResult & { opportunitySessions: number; skippedSessions: number } {
  const byItem = new Map<string, EligibilityObservation[]>();
  for (const observation of observations) {
    const group = byItem.get(observation.itemId) ?? [];
    group.push(observation);
    byItem.set(observation.itemId, group);
  }

  let result: WaitingResult = { maximum: 0 };
  let opportunitySessions = 0;
  let skippedSessions = 0;
  for (const [itemId, group] of byItem) {
    let waiting = 0;
    for (const observation of group.sort((left, right) => left.sessionIndex - right.sessionIndex)) {
      if (observation.scheduleKind !== "none") {
        // Served (or no longer applicable) — the wait clock resets.
        waiting = 0;
        continue;
      }
      if (!observation.eligible) {
        // The obligation exists but domain policy did not allow service.
        // This is neutral: existence is not a service opportunity.
        skippedSessions += 1;
        continue;
      }
      if (!hasServiceOpportunity(observation)) {
        // No real capacity to serve this skill this session — does not
        // advance the clock, does not reset it either (§1/§2 encargo).
        skippedSessions += 1;
        continue;
      }
      opportunitySessions += 1;
      waiting += 1;
      if (waiting > result.maximum) result = { maximum: waiting, itemId };
    }
  }
  return { ...result, opportunitySessions, skippedSessions };
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
      + (offender.itemId ? `; oldest=${offender.itemId}` : "")
      + `; opportunities counted: listening=${listening.opportunitySessions}, `
      + `production=${production.opportunitySessions}`
      + `; sessions without opportunity (skipped): listening=${listening.skippedSessions}, `
      + `production=${production.skippedSessions}`,
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
