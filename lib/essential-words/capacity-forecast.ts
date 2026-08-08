import type { ForecastSessionCapacity } from "./planning-types";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §4/D). The 8-session
 * reservation ledger (`buildCapacityForecast`/`reserveCapacity`) had no
 * production consumer left once `admission-control.ts` and
 * `placement/admission.ts` moved to backlog-based backpressure — it was
 * removed along with `future-capacity.ts`/`admission-capacity.ts`/
 * `hard-mandatory-forecast.ts`. `forecastActiveSessionCapacities` survives:
 * it is still used by `simulation/capacity.ts` to build the eight-active-session
 * telemetry window consumed by `simulation/day-forecast-telemetry.ts`.
 */
export function forecastActiveSessionCapacities(
  activeCalendar: readonly boolean[],
  currentDayIndex: number,
  budgetSeconds: number,
): ForecastSessionCapacity[] {
  const activeDays = activeCalendar
    .map((active, dayIndex) => ({ active, dayIndex }))
    .filter(({ active, dayIndex }) => active && dayIndex > currentDayIndex)
    .slice(0, 8);
  return activeDays.map((_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: budgetSeconds,
    listeningSeconds: budgetSeconds,
    productionSeconds: budgetSeconds,
  }));
}
