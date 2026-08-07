/**
 * Task 8.9h, Parte B — isolated sandbox comparing:
 *
 *   A. the current scheduler (day-granularity `dueAt`, ts-fsrs default
 *      rounding, see `lib/srs/fsrs-schedule.ts::scheduleFsrsReview`);
 *   B. an experimental sub-day learning/relearning policy that re-dues
 *      low-stability items sooner than the next whole day, before they
 *      would otherwise sit at a depressed retrievability for a full day
 *      (or more) once returned to "Review".
 *
 * This module does NOT modify `lib/srs/fsrs-schedule.ts`. It re-derives the
 * same forgetting-curve parameters (`generatorParameters` with the same
 * `request_retention`) and only *reads* `calculateFsrsRetrievability` from
 * the production scheduler. The experimental policy is applied out-of-band,
 * as a `SimulationHarnessHooks.mutateDay` hook that rewrites `dueAt` on the
 * in-memory simulation world for items that were just reviewed into a
 * low-stability "Review" state — it never touches the shared FSRS scheduler
 * used by the rest of the app.
 *
 * See docs/superpowers/plans/notes/2026-08-07-fase8-9h-c8-c9-spec-review.md
 * (Parte B) for the write-up this feeds, and
 * docs/superpowers/plans/notes/2026-08-07-fase8-9h-decision-record.md
 * (Decision 2) for the resulting spec decision.
 */
import { forgetting_curve, generatorParameters } from "ts-fsrs";
import {
  calculateFsrsRetrievability,
  DAY_MS,
  FSRS_DESIRED_RETENTION,
} from "@/lib/srs/fsrs-schedule";
import type { SimulationHarnessHooks, SimulationHookContext } from "../observations";
import type { SimulatedDay } from "../types";

/**
 * Below this prior stability (in days), the experimental policy applies.
 * 1 day matches the population 8.9g identified as most exposed to
 * day-rounding (beginner: 73.3% of reviews had prior stability < 1 day).
 */
export const SUB_DAY_STABILITY_THRESHOLD_DAYS = 1.0;

/** Floor so the experimental interval never collapses to "due immediately". */
const MIN_EXPERIMENTAL_INTERVAL_HOURS = 1;

// Same construction as fsrs-schedule.ts's internal FSRS_PARAMETERS, derived
// independently so this sandbox never imports/mutates the production module
// beyond its public, read-only exports.
const EXPERIMENT_PARAMETERS = generatorParameters({
  request_retention: FSRS_DESIRED_RETENTION,
});

/** Binary-search the elapsed-days value where the forgetting curve hits `targetRetention`. */
function idealIntervalDays(stability: number, targetRetention: number): number {
  let lo = 0;
  let hi = 3650;
  for (let iteration = 0; iteration < 60; iteration += 1) {
    const mid = (lo + hi) / 2;
    const retrievability = forgetting_curve(EXPERIMENT_PARAMETERS.w, mid, stability);
    if (retrievability > targetRetention) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** Current production behavior: whole-day rounding, minimum 1 day (mirrors `scheduleFsrsReview`). */
export function currentWholeDayIntervalDays(stability: number): number {
  return Math.max(1, Math.round(idealIntervalDays(stability, FSRS_DESIRED_RETENTION)));
}

/** Experimental behavior: fractional-day interval, floored at 1 hour, no whole-day rounding. */
export function experimentalSubDayIntervalDays(stability: number): number {
  const hours = Math.max(
    MIN_EXPERIMENTAL_INTERVAL_HOURS,
    idealIntervalDays(stability, FSRS_DESIRED_RETENTION) * 24,
  );
  return hours / 24;
}

export interface StabilityGridRow {
  stability: number;
  currentIntervalDays: number;
  currentRetrievabilityAtDue: number;
  experimentalIntervalDays: number;
  experimentalRetrievabilityAtDue: number;
}

/** Task 8.9h Parte B.4 — the required stability x {interval, retrievability} grid. */
export function buildStabilityGrid(stabilities: readonly number[]): StabilityGridRow[] {
  const epoch = new Date(0);
  return stabilities.map((stability) => {
    const currentIntervalDays = currentWholeDayIntervalDays(stability);
    const experimentalIntervalDays = experimentalSubDayIntervalDays(stability);
    return {
      stability,
      currentIntervalDays,
      currentRetrievabilityAtDue: calculateFsrsRetrievability({
        stability,
        lastReview: epoch,
        now: new Date(epoch.getTime() + currentIntervalDays * DAY_MS),
      }),
      experimentalIntervalDays,
      experimentalRetrievabilityAtDue: calculateFsrsRetrievability({
        stability,
        lastReview: epoch,
        now: new Date(epoch.getTime() + experimentalIntervalDays * DAY_MS),
      }),
    };
  });
}

/** Counters mutated in place while the hook runs; read after `runSimulation` returns. */
export interface SubDayRelearningTelemetry {
  itemsRescheduled: number;
  totalDaysPulledForward: number;
}

export function createEmptyTelemetry(): SubDayRelearningTelemetry {
  return { itemsRescheduled: 0, totalDaysPulledForward: 0 };
}

function findWorldItemById(context: SimulationHookContext, itemId: string) {
  for (const word of context.world.words.values()) {
    const candidates = [word.meaning, word.listening, word.production, ...word.usage.map((u) => u.item)];
    const match = candidates.find((item) => item.id === itemId);
    if (match) return match;
  }
  return undefined;
}

/**
 * Builds a `mutateDay` hook that applies policy B (sub-day relearning) to a
 * `runSimulation` call, mutating only that call's private in-memory world —
 * never `lib/srs/fsrs-schedule.ts` nor any shared scheduler state.
 */
export function createSubDayRelearningHooks(
  telemetry: SubDayRelearningTelemetry,
  thresholdDays: number = SUB_DAY_STABILITY_THRESHOLD_DAYS,
): SimulationHarnessHooks {
  return {
    mutateDay(day: SimulatedDay, context: SimulationHookContext): SimulatedDay {
      const todayIso = context.now.toISOString();
      for (const event of context.world.srsEvents) {
        if (event.occurredAt !== todayIso) continue;
        if (event.resultingSchedule.kind !== "fsrs") continue;
        if (event.resultingSchedule.state !== "Review") continue;
        if (event.resultingSchedule.stability >= thresholdDays) continue;

        const item = findWorldItemById(context, event.learningItemId);
        if (!item || item.schedule.kind !== "fsrs") continue;

        const currentDueMs = new Date(item.schedule.dueAt).getTime();
        const experimentalIntervalDays = experimentalSubDayIntervalDays(
          event.resultingSchedule.stability,
        );
        const experimentalDueMs = context.now.getTime() + experimentalIntervalDays * DAY_MS;
        if (experimentalDueMs >= currentDueMs) continue;

        item.schedule = { ...item.schedule, dueAt: new Date(experimentalDueMs).toISOString() };
        telemetry.itemsRescheduled += 1;
        telemetry.totalDaysPulledForward += (currentDueMs - experimentalDueMs) / DAY_MS;
      }
      return day;
    },
  };
}
