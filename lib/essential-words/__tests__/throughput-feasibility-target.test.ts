import { describe, expect, it } from "vitest";
import { buildAdmissionLoadEnvelope } from "../admission-envelope";
import {
  evaluateThroughputFeasibility,
  MARGINAL_FEASIBILITY_POLICY_VERSION,
} from "../throughput-feasibility";
import {
  computeRequiredArrivalSecondsPerSession,
  envelopeSecondsPerNewWord,
} from "../throughput-rates";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

const envelope = buildAdmissionLoadEnvelope({
  costs,
  introductionSeconds: 10,
  horizonSessions: 8,
});

describe("Task 8.9c target vs actual feasibility", () => {
  it("C: actual arrival bajo no hace que target feasibility pase", () => {
    const required = computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: true,
    });
    const result = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 700,
      committedBaseSecondsPerSession: 50,
      committedPlacementSecondsPerSession: 50,
      usageSecondsPerSession: 25,
      actualArrivalSecondsPerSession: 40,
      requiredArrivalSecondsPerSession: required,
    });
    expect(result.actualStatus).not.toBe("infeasible");
    expect(result.targetStatus).toBe("infeasible");
    expect(result.requiredArrivalSecondsPerSession).toBe(required);
  });

  it("D: mandatory futuro reduce target margin", () => {
    const required = computeRequiredArrivalSecondsPerSession({
      targetNewWordsPerSession: 10,
      minimumC8Share: 0.6,
      envelope,
      c8Applicable: true,
    });
    const light = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 100,
      committedBaseSecondsPerSession: 0,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 25,
      actualArrivalSecondsPerSession: required,
      requiredArrivalSecondsPerSession: required,
    });
    const heavy = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 500,
      committedBaseSecondsPerSession: 0,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 25,
      actualArrivalSecondsPerSession: required,
      requiredArrivalSecondsPerSession: required,
    });
    expect(heavy.marginSecondsPerSession).toBeLessThan(light.marginSecondsPerSession);
    expect(MARGINAL_FEASIBILITY_POLICY_VERSION).toMatch(/^marginal-feasibility-v/);
  });

  it("J-capable: capacidad suficiente → target feasible", () => {
    const required = 6 * envelopeSecondsPerNewWord(envelope);
    const result = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatorySecondsPerSession: 100,
      committedBaseSecondsPerSession: 50,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 25,
      actualArrivalSecondsPerSession: required,
      requiredArrivalSecondsPerSession: required,
    });
    expect(result.targetStatus).toBe("feasible");
    expect(result.marginSecondsPerSession).toBeGreaterThan(0);
  });

  it("I-capable: carga imposible → target infeasible", () => {
    const required = 6 * envelopeSecondsPerNewWord(envelope);
    const result = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 200,
      committedMandatorySecondsPerSession: 180,
      committedBaseSecondsPerSession: 0,
      committedPlacementSecondsPerSession: 0,
      usageSecondsPerSession: 0,
      actualArrivalSecondsPerSession: 20,
      requiredArrivalSecondsPerSession: required,
    });
    expect(result.targetStatus).toBe("infeasible");
    expect(result.bottlenecks.length).toBeGreaterThan(0);
  });
});
