import { describe, expect, it } from "vitest";
import {
  baseSkillActivationLiveness,
  backlogStable,
  budgetRespected,
  newWordLiveness,
  noOverdueStarvation,
  noSynchronizedPeaks,
  observedRetentionWithinTarget,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
  usageActivationShare,
} from "../criteria";
import { PROFILES } from "../profiles";
import { runSimulation } from "../run-simulation";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

const results = new Map(Object.values(PROFILES).map((profile) => [
  profile.id,
  runSimulation(profile, options),
]));

for (const profile of Object.values(PROFILES)) {
  describe(`perfil ${profile.id}`, () => {
    const result = results.get(profile.id)!;

    it("criterio 1 — presupuesto", () => {
      expect(budgetRespected(result.days, 900)).toMatchObject({ passed: true });
    });

    it("criterio 2 — p95", () => {
      expect(percentile95WithinBudget(result.days, 900))
        .toMatchObject({ passed: true });
    });

    it("criterio 3 — salida recovery", () => {
      expect(recoveryExits(result.days)).toMatchObject({ passed: true });
    });

    it("criterio 6 — cuota usage", () => {
      expect(usageActivationShare(result.days, 7, 10, 0.3))
        .toMatchObject({ passed: true });
    });

    it("criterio 7 — picos sincronizados", () => {
      expect(noSynchronizedPeaks(result.days, 900))
        .toMatchObject({ passed: true });
    });

    it("criterio 9 — liveness base", () => {
      expect(baseSkillActivationLiveness(result.eligibility, 8))
        .toMatchObject({ passed: true });
    });

    it("criterio 10 — no starvation", () => {
      expect(noOverdueStarvation(result.deferredObservations, 12))
        .toMatchObject({ passed: true });
    });

    it("criterio 11 — retención", () => {
      expect(observedRetentionWithinTarget(
        result.attemptLogs,
        result.srsEvents,
        0.9,
        0.05,
        50,
      )).toMatchObject({ passed: true });
    });
  });
}

describe("criterios específicos", () => {
  const steady = results.get("steady")!;
  const bursty = results.get("bursty")!;

  it("criterio 4 — backlog estable en constante", () => {
    expect(backlogStable(steady.days, 14, 2, 900))
      .toMatchObject({ passed: true });
  });

  it("criterio 5 — regreso tras ausencia", () => {
    expect(recoveryReturnSessions(bursty.days, 14))
      .toMatchObject({ passed: true });
  });

  it("criterio 8 — nuevas cuando no hay presión", () => {
    expect(newWordLiveness(steady.days, 10))
      .toMatchObject({ passed: true });
  });
});
