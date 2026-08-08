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

  // This is a 180-day integration simulation over 300 words. Allow for a
  // contended CI worker without weakening the timeout for the unit suite.
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
    // El cap canónico de usage de Task 8.10 evita que C6 sea un detector
    // indirecto de placement. Este adversarial se detecta por sus invariantes
    // de dominio explícitos, sin forzar un fallo artificial en C1–C11 ni
    // reabrir la política de placement.
  }, 15_000);
});
