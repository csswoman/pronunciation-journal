import { describe, expect, it } from "vitest";
import { buildAdmissionLoadEnvelope } from "../../admission-envelope";
import { isC8Applicable } from "../../criterion-applicability";
import {
  evaluateThroughputFeasibility,
} from "../../throughput-feasibility";
import {
  computeRequiredArrivalSecondsPerSession,
  envelopeSecondsPerNewWord,
} from "../../throughput-rates";
import { PROFILES } from "../profiles";
import {
  runSimulation,
  SIMULATION_COSTS,
  SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
} from "../run-simulation";
import type { SimulationOptions } from "../state";

const options: SimulationOptions = {
  days: 180,
  corpusSize: 1_000,
  seed: 42,
  startAt: "2026-08-01T00:00:00.000Z",
  dailyBudgetSeconds: 900,
  targetNewWords: 10,
};

describe("Task 8.9c feasibility flow", () => {
  it("G: steady reporta rates actual/required y feasibility target", () => {
    const result = runSimulation(PROFILES.steady, { ...options, days: 30 });
    const active = result.days.filter((day) => day.active);
    expect(active.every((day) => day.c8CriterionApplicable === true)).toBe(true);
    expect(active.every((day) => (
      day.targetFeasibilityStatus === "feasible"
      || day.targetFeasibilityStatus === "marginal"
      || day.targetFeasibilityStatus === "infeasible"
    ))).toBe(true);
    expect(active.some((day) => (day.requiredArrivalRateSeconds ?? 0) > 0)).toBe(true);
  });

  it("E: advanced incluye placement/base reales cuando existen", () => {
    const result = runSimulation(PROFILES.advanced, { ...options, days: 60 });
    const active = result.days.filter((day) => day.active);
    const hadPlacementCandidates = active.some((day) => day.placementCandidates > 0);
    expect(hadPlacementCandidates).toBe(true);
    if (hadPlacementCandidates) {
      expect(active.some((day) => (
        day.placementReservedSeconds > 0
        || day.placementConversions > 0
        || (day.committedPlacementSeconds ?? 0) > 0
      ))).toBe(true);
    }
    expect(active.some((day) => (day.committedBaseSeconds ?? 0) > 0
      || day.baseSkillActivations > 0)).toBe(true);
  });

  it("C: actual bajo no implica target feasible cuando no cabe la demanda", () => {
    const envelope = buildAdmissionLoadEnvelope({
      costs: SIMULATION_COSTS,
      introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
      horizonSessions: 8,
    });
    const required = computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: true,
    });
    const feasibility = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 700,
      committedBaseSecondsPerSession: 0,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 0,
      actualArrivalSecondsPerSession: 50,
      requiredArrivalSecondsPerSession: required,
    });
    // sustainable=200: actual 50 fits; required ~474 does not.
    expect(feasibility.actualStatus).not.toBe("infeasible");
    expect(feasibility.targetStatus).toBe("infeasible");
  });

  it("C8 applicability: solo steady", () => {
    expect(isC8Applicable("steady")).toBe(true);
    expect(isC8Applicable("advanced")).toBe(false);
    const envelope = buildAdmissionLoadEnvelope({
      costs: SIMULATION_COSTS,
      introductionSeconds: SIMULATION_NEW_WORD_INTRODUCTION_SECONDS,
      horizonSessions: 8,
    });
    expect(computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: false,
    })).toBe(0);
    expect(6 * envelopeSecondsPerNewWord(envelope)).toBe(474);
  });
});
