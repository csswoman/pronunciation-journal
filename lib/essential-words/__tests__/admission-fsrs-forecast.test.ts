import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import { deriveBaseBacklogPolicy } from "../pending-base-fairness";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7a): admission-envelope.ts
 * + hard-mandatory-forecast.ts collapsed into an inline amortized per-word
 * cost inside daily-budget.ts (perNewWordAmortized). These tests fix the
 * observable behavior that module pair used to provide — review debt and
 * pending-base backlog both reduce admitted new words — against the
 * simplified `admitNewWords` contract, not the deleted forecast machinery.
 */
const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

describe("admission with amortized review/backlog debt", () => {
  it("A: menos remainingSeconds (equivalente a reviews FSRS consumiendo budget) reduce capacitySafeNewWords", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const candidates = Array.from({ length: 20 }, (_, index) => ({
      wordId: `w${index}`,
      rank: index,
    }));
    const perNewWord = 10 + costs.recognition + costs.listening + costs.production;

    const withoutReviewLoad = admitNewWords({
      candidates,
      configuredNewWordLimit: 20,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
    });

    const withReviewLoad = admitNewWords({
      candidates,
      configuredNewWordLimit: 20,
      // Simulates a session where mandatory FSRS reviews already consumed
      // most of the budget before admission gets a share.
      remainingSeconds: 60,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
    });

    expect(withReviewLoad.capacitySafeNewWords).toBeLessThan(withoutReviewLoad.capacitySafeNewWords);
  });

  it("E/H: backlog consume la misma capacidad; al liberar presión vuelve capacidad", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const candidates = [
      { wordId: "a", rank: 1 },
      { wordId: "b", rank: 2 },
      { wordId: "c", rank: 3 },
      { wordId: "d", rank: 4 },
    ];
    const perNewWord = 10 + costs.recognition + costs.listening + costs.production;

    const pressure = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.9,
      backlogPolicy: policy,
    });

    const roomy = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
    });

    expect(pressure.capacitySafeNewWords).toBeLessThan(roomy.capacitySafeNewWords);
    expect(roomy.capacitySafeNewWords).toBeGreaterThanOrEqual(2);
  });
});
