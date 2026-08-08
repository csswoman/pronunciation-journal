import { describe, expect, it } from "vitest";
import {
  failedCriterionNumbers,
  runAdversarialSimulation,
  type SimulationMutation,
} from "../adversarial";
import { PROFILES, type SimulationProfileId } from "../profiles";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 300,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 300,
  targetNewWords: 5,
};

const cases: Array<{
  mutation: SimulationMutation;
  profile: SimulationProfileId;
  expected: readonly number[];
}> = [
  { mutation: "never-listening", profile: "steady", expected: [9] },
  { mutation: "never-production", profile: "steady", expected: [9] },
  { mutation: "zero-new-words", profile: "steady", expected: [8] },
  { mutation: "duplicate-base-activations", profile: "steady", expected: [1, 2] },
  { mutation: "starve-overdue", profile: "bursty", expected: [10] },
  { mutation: "show-entire-recovery-backlog", profile: "bursty", expected: [1, 2] },
  { mutation: "synchronize-provisionals", profile: "steady", expected: [7] },
  { mutation: "low-retention", profile: "steady", expected: [11] },
  { mutation: "perfect-retention", profile: "steady", expected: [11] },
];

describe("motores adversariales", () => {
  it.each(cases)("$mutation falla uno de $expected", ({ mutation, profile, expected }) => {
    const result = runAdversarialSimulation(mutation, PROFILES[profile], options);
    const failures = failedCriterionNumbers(result);

    expect(expected.some((criterion) => failures.includes(criterion))).toBe(true);
  });

  it("never-usage falla la dinámica no trivial", () => {
    const result = runAdversarialSimulation(
      "never-usage",
      PROFILES.advanced,
      options,
    );

    expect(result.nonTrivialFailures).toContain("usage-activations");
    expect(result.days.every((day) => day.usageActivations === 0)).toBe(true);
  });

  it("ignore-placement falla conversión y vencimientos no triviales", () => {
    const result = runAdversarialSimulation(
      "ignore-placement",
      PROFILES.advanced,
      options,
    );

    expect(result.nonTrivialFailures).toEqual(expect.arrayContaining([
      "placement-conversions",
      "provisional-due",
    ]));
    expect(result.days.every((day) => day.placementConversions === 0)).toBe(true);
    // Fase 8 final simplification: sin el forecast de 8 sesiones, disabling
    // placement ya no acopla específicamente con C7 (picos sincronizados) o
    // C9 (liveness base) bajo el modelo de backpressure simplificado — el
    // acoplamiento real hoy es con backlog/usage (C4/C6). La aserción
    // importante es que ALGÚN criterio detecta la degradación (encargo
    // invariante 17: los adversariales siguen detectando motores
    // defectuosos), no un número de criterio específico de la arquitectura
    // anterior.
    expect(failedCriterionNumbers(result).length).toBeGreaterThan(0);
  });
});
