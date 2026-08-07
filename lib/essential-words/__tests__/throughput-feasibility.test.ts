import { describe, expect, it } from "vitest";
import {
  evaluateThroughputFeasibility,
  steadyC8C9Requirements,
} from "../throughput-feasibility";

describe("evaluateThroughputFeasibility", () => {
  it("K: requisitos mínimos derivados de C8>=0.60 y C9<=8", () => {
    const req = steadyC8C9Requirements({
      targetNewWordsPerSession: 10,
      minimumAcceptedShare: 0.6,
      horizonSessions: 8,
      perNewWordSeconds: 10 + 12 + 20 + 25,
      reviewEnvelopeSecondsPerWord: 12,
    });
    expect(req.requiredNewWordsPerSession).toBe(6);
    expect(req.requiredBaseActivationsPerSession).toBe(12);
    expect(req.requiredSecondsPerSession).toBeGreaterThan(0);
  });

  it("J: configuración con capacidad suficiente → feasible", () => {
    const result = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 900,
      committedMandatoryPerSession: 100,
      committedBasePerSession: 50,
      committedPlacementPerSession: 0,
      usagePerSession: 25,
      requiredNewWordsPerSession: 6,
      secondsPerNewWordImmediate: 22,
      secondsPerNewWordBase: 45,
      expectedFsrsPerNewWordPerSession: [0, 0, 0, 0, 0, 0, 0, 12],
    });
    expect(result.status).toBe("feasible");
    expect(result.residualSeconds).toBeGreaterThanOrEqual(0);
  });

  it("I: configuración deliberadamente imposible → infeasible", () => {
    const result = evaluateThroughputFeasibility({
      horizonSessions: 8,
      availableSecondsPerSession: 200,
      committedMandatoryPerSession: 180,
      committedBasePerSession: 0,
      committedPlacementPerSession: 0,
      usagePerSession: 0,
      requiredNewWordsPerSession: 6,
      secondsPerNewWordImmediate: 22,
      secondsPerNewWordBase: 45,
      expectedFsrsPerNewWordPerSession: [12, 12, 12, 12, 12, 12, 12, 12],
    });
    expect(result.status).toBe("infeasible");
    expect(result.bottlenecks.length).toBeGreaterThan(0);
  });
});
