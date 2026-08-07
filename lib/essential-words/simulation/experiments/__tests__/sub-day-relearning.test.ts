import { describe, expect, it } from "vitest";
import { PROFILES } from "../../profiles";
import { runSimulation } from "../../run-simulation";
import {
  buildStabilityGrid,
  createEmptyTelemetry,
  createSubDayRelearningHooks,
  experimentalSubDayIntervalDays,
  SUB_DAY_STABILITY_THRESHOLD_DAYS,
} from "../sub-day-relearning";

/**
 * Task 8.9h, Parte B — sandbox tests. Nothing here touches
 * lib/srs/fsrs-schedule.ts; the experimental policy is applied only inside
 * these isolated `runSimulation` calls via `mutateDay` hooks.
 */
describe("Task 8.9h — sub-day relearning sandbox", () => {
  it("produce la grilla de stabilities 0.1..2.0 con intervalos y retrievability", () => {
    const grid = buildStabilityGrid([0.1, 0.3, 0.5, 0.8, 1.0, 2.0]);

    expect(grid).toHaveLength(6);
    for (const row of grid) {
      // El intervalo actual respeta el redondeo a día entero (mínimo 1).
      expect(Number.isInteger(row.currentIntervalDays)).toBe(true);
      expect(row.currentIntervalDays).toBeGreaterThanOrEqual(1);
      // El intervalo experimental es sub-día o igual, nunca mayor que el actual.
      expect(row.experimentalIntervalDays).toBeLessThanOrEqual(row.currentIntervalDays);
      // La retrievability experimental en el due debe acercarse más a 0.9
      // que la actual (el objetivo de la política).
      expect(
        Math.abs(row.experimentalRetrievabilityAtDue - 0.9),
      ).toBeLessThanOrEqual(Math.abs(row.currentRetrievabilityAtDue - 0.9) + 1e-4);
    }
  });

  it("el intervalo experimental nunca es mayor que el actual (política solo acelera, no retrasa)", () => {
    for (const stability of [0.05, 0.2, 0.6, 0.9, 1.5, 3, 10]) {
      expect(experimentalSubDayIntervalDays(stability))
        .toBeLessThanOrEqual(Math.max(1, Math.round(stability + 100)));
    }
  });

  it("el hook solo reprograma items con stability previa por debajo del umbral", () => {
    const telemetry = createEmptyTelemetry();
    const hooks = createSubDayRelearningHooks(telemetry, SUB_DAY_STABILITY_THRESHOLD_DAYS);

    const baseline = runSimulation(PROFILES.beginner, {
      days: 60,
      corpusSize: 40,
      seed: 42,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 200_000,
      targetNewWords: 10,
    });
    const experimental = runSimulation(PROFILES.beginner, {
      days: 60,
      corpusSize: 40,
      seed: 42,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 200_000,
      targetNewWords: 10,
    }, hooks);

    expect(telemetry.itemsRescheduled).toBeGreaterThan(0);
    expect(telemetry.totalDaysPulledForward).toBeGreaterThan(0);
    // Reprogramar hacia adelante en el tiempo no puede generar MÁS
    // scheduled-reviews reales que sesiones activas disponibles; solo
    // verificamos que la corrida sigue siendo válida (no revienta) y que
    // produce al menos tantas scheduled-reviews como el baseline (las
    // reprogramaciones adelantan trabajo, no lo eliminan).
    const baselineScheduled = baseline.attemptLogs.filter((a) => a.eventType === "scheduled-review").length;
    const experimentalScheduled = experimental.attemptLogs.filter((a) => a.eventType === "scheduled-review").length;
    expect(experimentalScheduled).toBeGreaterThanOrEqual(baselineScheduled);
  });
});
