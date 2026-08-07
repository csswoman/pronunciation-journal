import { describe, expect, it } from "vitest";
import { buildAdmissionLoadEnvelope } from "../../admission-envelope";
import {
  evaluateThroughputFeasibility,
  steadyC8C9Requirements,
} from "../../throughput-feasibility";
import { PROFILES } from "../profiles";
import { runSimulation, SIMULATION_COSTS, SIMULATION_NEW_WORD_INTRODUCTION_SECONDS } from "../run-simulation";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("Task 8.9b flow balance and feasibility", () => {
  it("G: steady reporta arrival/service y feasibilityStatus", () => {
    const result = runSimulation(PROFILES.steady, { ...options, days: 30 });
    const active = result.days.filter((day) => day.active);
    expect(active.every((day) => (
      day.feasibilityStatus === "feasible" || day.feasibilityStatus === "infeasible"
    ))).toBe(true);
    expect(active.some((day) => typeof day.arrivalMinusServiceSeconds === "number")).toBe(true);
  });

  it("propiedad: requisitos C8/C9 y feasibility estructural del presupuesto", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs: SIMULATION_COSTS,
      introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
      horizonSessions: 8,
    });
    const req = steadyC8C9Requirements({
      targetNewWordsPerSession: 10,
      minimumAcceptedShare: 0.6,
      horizonSessions: 8,
      perNewWordSeconds: envelope.immediateSeconds + envelope.baseActivationSeconds,
      reviewEnvelopeSecondsPerWord: envelope.expectedReviewSecondsBySession
        .reduce((total, value) => total + value, 0),
    });
    expect(req.requiredNewWordsPerSession).toBe(6);

    const feasibility = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatoryPerSession: 0,
      committedBasePerSession: 0,
      committedPlacementPerSession: 0,
      usagePerSession: 0,
      requiredNewWordsPerSession: req.requiredNewWordsPerSession,
      secondsPerNewWordImmediate: envelope.immediateSeconds,
      secondsPerNewWordBase: envelope.baseActivationSeconds,
      expectedFsrsPerNewWordPerSession: envelope.expectedReviewSecondsBySession,
    });
    // Empty committed load: 6 words * (22+45) + reviews should still fit in 900.
    expect(feasibility.status).toBe("feasible");
  });
});
