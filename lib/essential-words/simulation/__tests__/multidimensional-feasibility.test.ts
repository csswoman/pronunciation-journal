import { describe, expect, it } from "vitest";
import {
  C9_HORIZON_SESSIONS,
  deriveRequiredBaseActivations,
  evaluateMultidimensionalFeasibility,
} from "../../base-throughput-feasibility";
import { DEFAULT_ACTIVATION_LIMITS } from "../../daily-budget";
import { PROFILES } from "../profiles";
import { runSimulation } from "../run-simulation";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 60,
  corpusSize: 400,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("Task 8.9d profile multidimensional feasibility", () => {
  it("M: cinco perfiles deterministas reportan base-slot status", () => {
    for (const profile of Object.values(PROFILES)) {
      const first = runSimulation(profile, options);
      const second = runSimulation(profile, options);
      expect(second.days.map((day) => day.baseSkillActivations))
        .toEqual(first.days.map((day) => day.baseSkillActivations));

      const multi = evaluateMultidimensionalFeasibility({
        configuredNewWordsTarget: profile.id === "steady" ? 10 : 0,
        minimumC8Share: 0.6,
        horizonSessions: C9_HORIZON_SESSIONS,
        availableSecondsPerSession: 900,
        maxBaseSkillActivationsPerSession:
          DEFAULT_ACTIVATION_LIMITS.maxBaseSkillActivationsPerSession,
        requiredArrivalSecondsPerSession: profile.id === "steady" ? 474 : 0,
      });
      expect(["feasible", "marginal", "infeasible"]).toContain(multi.overallStatus);
      expect(multi.baseActivations.serviceCapacityPerSession).toBe(4);
    }
  });

  it("steady: hipótesis 96 vs 32 bajo política actual", () => {
    const derived = deriveRequiredBaseActivations({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
    });
    expect(derived.requiredBaseActivationsOverHorizon).toBe(96);
    expect(4 * 8).toBe(32);
    const multi = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      maxBaseSkillActivationsPerSession: 4,
      requiredArrivalSecondsPerSession: 474,
    });
    expect(multi.baseActivations.status).toBe("infeasible");
    expect(multi.overallStatus).toBe("infeasible");
  });
});
