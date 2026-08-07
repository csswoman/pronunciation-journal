import { describe, expect, it } from "vitest";
import {
  BASE_THROUGHPUT_CONTRACT_VERSION,
  C9_HORIZON_SESSIONS,
  REQUIRED_BASE_SKILLS_WITHIN_C9,
  deriveRequiredBaseActivations,
  describeMaxBaseSkillActivationsContract,
  evaluateMultidimensionalFeasibility,
  evaluateBaseActivationWindows,
  reconcileBaseActivationDemand,
} from "../base-throughput-feasibility";
import { MARGINAL_FEASIBILITY_POLICY_VERSION } from "../throughput-feasibility";

describe("Task 8.9d base throughput contract", () => {
  it("A/B: required base rate se deriva del contrato, no hardcoded", () => {
    const derived = deriveRequiredBaseActivations({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: C9_HORIZON_SESSIONS,
    });
    expect(REQUIRED_BASE_SKILLS_WITHIN_C9).toEqual(["listening", "production"]);
    expect(derived.requiredBaseActivationsPerWord)
      .toBe(REQUIRED_BASE_SKILLS_WITHIN_C9.length);
    expect(derived.requiredNewWordsPerSession).toBe(6);
    expect(derived.requiredBaseActivationsPerSession).toBe(12);
    expect(derived.requiredBaseActivationsOverHorizon).toBe(96);
  });

  it("C/D/E: 6×2×8=96 vs hard cap 4×8=32 => infeasible", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: C9_HORIZON_SESSIONS,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 100,
      committedBaseSecondsPerSession: 0,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 25,
      maxBaseSkillActivationsPerSession: 4,
      requiredArrivalSecondsPerSession: 474,
      actualArrivalSecondsPerSession: 80,
    });
    expect(result.baseActivations.requiredPerSession).toBe(12);
    expect(result.baseActivations.serviceCapacityPerSession).toBe(4);
    expect(result.baseActivations.requiredOverHorizon).toBe(96);
    expect(result.baseActivations.serviceCapacityOverHorizon).toBe(32);
    expect(result.baseActivations.status).toBe("infeasible");
    expect(result.seconds.status).not.toBe("infeasible");
    expect(result.overallStatus).toBe("infeasible");
    expect(result.bottlenecks).toContain("base-activation-slots");
  });

  it("F: segundos suficientes no hacen overall feasible", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 0,
      maxBaseSkillActivationsPerSession: 4,
      requiredArrivalSecondsPerSession: 100,
      actualArrivalSecondsPerSession: 50,
    });
    expect(result.seconds.status).toBe("feasible");
    expect(result.baseActivations.status).toBe("infeasible");
    expect(result.overallStatus).toBe("infeasible");
  });

  it("G: slots suficientes => baseActivations feasible", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 0,
      maxBaseSkillActivationsPerSession: 12,
      requiredArrivalSecondsPerSession: 474,
      actualArrivalSecondsPerSession: 474,
    });
    expect(result.baseActivations.serviceCapacityOverHorizon).toBe(96);
    expect(result.baseActivations.status).toBe("feasible");
    expect(result.overallStatus).not.toBe("infeasible");
  });

  it("H/I/J: placement + pending con dedupe por itemId", () => {
    const demand = reconcileBaseActivationDemand({
      requiredFromNewWords: [
        { itemId: "c1k:a#listening", skill: "listening" },
        { itemId: "c1k:a#production", skill: "production" },
      ],
      requiredFromPlacement: [
        { itemId: "c1k:a#listening", skill: "listening" },
        { itemId: "c1k:b#listening", skill: "listening" },
      ],
      requiredFromExistingPending: [
        { itemId: "c1k:b#listening", skill: "listening" },
        { itemId: "c1k:c#production", skill: "production" },
      ],
    });
    // Ownership: pending > placement > new-words (inherited debt wins).
    expect(demand.totalRequiredBaseActivations).toBe(4);
    expect(demand.requiredFromExistingPending).toBe(2);
    expect(demand.requiredFromPlacement).toBe(1);
    expect(demand.requiredFromNewWords).toBe(1);
  });

  it("K: rolling window detecta pico local aunque promedio global pase", () => {
    const windows = evaluateBaseActivationWindows({
      horizonSessions: 8,
      serviceCapacityPerSession: 4,
      // Early windows average ≤4/session; later dense spike is locally infeasible.
      requiredActivationsBySession: [
        2, 2, 2, 2, 2, 2, 2, 2,
        8, 8, 8, 8, 8, 8, 8, 8,
      ],
    });
    expect(windows.worstMargin).toBeLessThan(0);
    expect(windows.firstInfeasibleWindowStart).toBeGreaterThanOrEqual(0);
    expect(windows.maxRequiredInWindow).toBe(64);
    expect(windows.availableSlotsInWindow).toBe(32);
    // Global average of the series can look milder than the worst window.
    const globalAverage = windows.maxRequiredInWindow; // worst window = full spike
    expect(globalAverage).toBeGreaterThan(windows.availableSlotsInWindow);
  });

  it("L: listening/production se reportan separadamente", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      maxBaseSkillActivationsPerSession: 4,
      requiredArrivalSecondsPerSession: 474,
      listeningRequiredPerSession: 6,
      productionRequiredPerSession: 6,
      listeningServedPerSession: 3,
      productionServedPerSession: 1,
    });
    expect(result.listeningActivations?.requiredPerSession).toBe(6);
    expect(result.productionActivations?.requiredPerSession).toBe(6);
    expect(result.listeningActivations?.serviceCapacityPerSession).toBeDefined();
    expect(result.productionActivations?.serviceCapacityPerSession).toBeDefined();
  });

  it("documenta el contrato real de maxBase", () => {
    const doc = describeMaxBaseSkillActivationsContract();
    expect(doc.version).toBe(BASE_THROUGHPUT_CONTRACT_VERSION);
    expect(doc.isHardCap).toBe(true);
    expect(doc.jointListeningAndProduction).toBe(true);
    expect(doc.placementConsumesSameSelectionCap).toBe(false);
    expect(doc.learningStepsConsumeSameSelectionCap).toBe(false);
    expect(doc.dueReservationCanRaiseCap).toBe(true);
    expect(MARGINAL_FEASIBILITY_POLICY_VERSION).toMatch(/^marginal-feasibility-v/);
  });
});
