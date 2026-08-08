import { describe, expect, it } from "vitest";
import {
  BASE_THROUGHPUT_CONTRACT_VERSION,
  C9_HORIZON_SESSIONS,
  REQUIRED_BASE_SKILLS_WITHIN_C9,
  deriveRequiredBaseActivations,
  describeMaxBaseSkillActivationsContract,
  evaluateBaseActivationWindows,
  evaluateMultidimensionalFeasibility,
  projectBaseServiceCapacityPerSession,
  reconcileBaseActivationDemand,
} from "../base-throughput-feasibility";
import { MARGINAL_FEASIBILITY_POLICY_VERSION } from "../throughput-feasibility";

describe("Task 8.9d/e base throughput contract", () => {
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

  it("N: serviceBase ya no es 4×horizon; proyección residual puede caber 12", () => {
    const projected = projectBaseServiceCapacityPerSession({
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 100,
      listeningCost: 20,
      productionCost: 25,
    });
    expect(projected).toBeGreaterThanOrEqual(12);
    expect(projected).not.toBe(4);

    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: C9_HORIZON_SESSIONS,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 100,
      usageSecondsPerSession: 25,
      projectedBaseServicePerSession: projected,
      requiredArrivalSecondsPerSession: 474,
      actualArrivalSecondsPerSession: 80,
    });
    expect(result.baseActivations.serviceCapacityPerSession).toBe(projected);
    expect(result.baseActivations.serviceCapacityOverHorizon).not.toBe(32);
  });

  it("legacy hard-cap 4 sigue detectando incompatibilidad si se fuerza", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: C9_HORIZON_SESSIONS,
      availableSecondsPerSession: 900,
      projectedBaseServicePerSession: 4,
      requiredArrivalSecondsPerSession: 474,
    });
    expect(result.baseActivations.requiredOverHorizon).toBe(96);
    expect(result.baseActivations.serviceCapacityOverHorizon).toBe(32);
    expect(result.baseActivations.status).toBe("infeasible");
    expect(result.overallStatus).toBe("infeasible");
  });

  it("F: segundos suficientes no hacen overall feasible si slots proyectados faltan", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      projectedBaseServicePerSession: 4,
      requiredArrivalSecondsPerSession: 100,
      actualArrivalSecondsPerSession: 50,
    });
    expect(result.seconds.status).toBe("feasible");
    expect(result.baseActivations.status).toBe("infeasible");
    expect(result.overallStatus).toBe("infeasible");
  });

  it("G: slots proyectados suficientes => baseActivations feasible", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      projectedBaseServicePerSession: 12,
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
    expect(demand.totalRequiredBaseActivations).toBe(4);
    expect(demand.requiredFromExistingPending).toBe(2);
    expect(demand.requiredFromPlacement).toBe(1);
    expect(demand.requiredFromNewWords).toBe(1);
  });

  it("K/O: rolling window detecta pico local", () => {
    const windows = evaluateBaseActivationWindows({
      horizonSessions: 8,
      serviceCapacityPerSession: 12,
      requiredActivationsBySession: [
        2, 2, 2, 2, 2, 2, 2, 2,
        20, 20, 20, 20, 20, 20, 20, 20,
      ],
    });
    expect(windows.worstMargin).toBeLessThan(0);
    expect(windows.maxRequiredInWindow).toBe(160);
  });

  it("L: listening/production se reportan separadamente", () => {
    const result = evaluateMultidimensionalFeasibility({
      configuredNewWordsTarget: 10,
      minimumC8Share: 0.6,
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      projectedBaseServicePerSession: 12,
      requiredArrivalSecondsPerSession: 474,
      listeningRequiredPerSession: 6,
      productionRequiredPerSession: 6,
    });
    expect(result.listeningActivations?.requiredPerSession).toBe(6);
    expect(result.productionActivations?.requiredPerSession).toBe(6);
  });

  it("documenta que maxBase ya no es hard cap operativo", () => {
    const doc = describeMaxBaseSkillActivationsContract();
    expect(doc.version).toBe(BASE_THROUGHPUT_CONTRACT_VERSION);
    expect(doc.isHardCap).toBe(false);
    expect(doc.isSafetyDefaultOrigin).toBe(true);
    expect(MARGINAL_FEASIBILITY_POLICY_VERSION).toMatch(/^marginal-feasibility-v/);
  });
});
