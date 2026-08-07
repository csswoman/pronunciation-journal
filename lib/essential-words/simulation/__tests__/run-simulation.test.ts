import { describe, expect, it } from "vitest";
import { PROFILES } from "../profiles";
import { runSimulation } from "../run-simulation";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 90,
  corpusSize: 160,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 300,
  targetNewWords: 5,
};

describe("runSimulation", () => {
  it("activa listening y production a lo largo de 90 días", () => {
    const result = runSimulation(PROFILES.steady, options);

    expect(result.days.some((day) => day.baseSkillActivations > 0)).toBe(true);
    expect(result.worldCounts.activeListening).toBeGreaterThan(0);
    expect(result.worldCounts.activeProduction).toBeGreaterThan(0);
  });

  it("genera y vence provisionales", () => {
    const result = runSimulation(PROFILES.advanced, options);

    expect(result.days.some((day) => day.placementConversions > 0)).toBe(true);
    expect(result.days.some((day) => day.provisionalDue > 0)).toBe(true);
  });

  it("activa usage cuando se vuelve elegible", () => {
    const result = runSimulation(PROFILES.advanced, { ...options, days: 180 });

    expect(result.days.some((day) => day.usageActivations > 0)).toBe(true);
    expect(result.worldCounts.activeUsage).toBeGreaterThan(0);
  });

  it("un día inactivo acumula deuda sin planificar sesión", () => {
    const result = runSimulation(PROFILES.bursty, { ...options, days: 120 });
    const idle = result.days.find((day) => !day.active)!;

    expect(idle.plannedSeconds).toBe(0);
    expect(result.days.some((day) => !day.active && day.backlogSeconds > 0)).toBe(true);
  });

  it("lo diferido no desaparece", () => {
    const result = runSimulation(PROFILES.bursty, {
      ...options,
      days: 120,
      dailyBudgetSeconds: 90,
    });

    expect(result.days.some((day) => day.deferredMandatory > 0)).toBe(true);
    expect(result.maxDeferredAgeSessions).toBeGreaterThan(0);
  });

  it("la retención diaria usa intentos de revisiones programadas", () => {
    const result = runSimulation(PROFILES.steady, options);
    const attempts = result.attemptLogs.filter((attempt) => (
      attempt.eventType === "scheduled-review"
    ));

    expect(result.days.reduce((total, day) => total + day.scheduledReviews, 0))
      .toBe(attempts.length);
    expect(result.days.every((day) => (
      day.correctScheduledReviews <= day.scheduledReviews
    ))).toBe(true);
  });

  it("misma semilla reproduce el resultado completo", () => {
    const first = runSimulation(PROFILES.steady, options);
    const second = runSimulation(PROFILES.steady, options);

    expect(second).toEqual(first);
  });
});
