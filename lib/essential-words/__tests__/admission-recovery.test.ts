import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import { deriveBaseBacklogPolicy } from "../pending-base-fairness";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};
const perNewWord = 10 + costs.recognition;

describe("N: liberar pending base recupera admission", () => {
  it("con margen target, menos backlog aumenta capacitySafeNewWords", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const candidates = Array.from({ length: 10 }, (_, index) => ({
      wordId: `c1k:new-${index}`,
      rank: index + 1,
    }));

    const pressedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.95,
      backlogPolicy: policy,
    });
    const relievedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.05,
      backlogPolicy: policy,
    });
    expect(pressedAdmission.capacitySafeNewWords).toBeLessThan(10);
    expect(relievedAdmission.capacitySafeNewWords)
      .toBeGreaterThan(pressedAdmission.capacitySafeNewWords);
  });
});
