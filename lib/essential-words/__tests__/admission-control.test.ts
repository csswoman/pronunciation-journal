import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import { deriveBaseBacklogPolicy } from "../pending-base-fairness";
import { planDailySession } from "../daily-budget";
import type {
  ActivationLimits,
  DailyPlanningInput,
  NewWordCandidate,
} from "../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";
import { baseSkillActivationLiveness } from "../simulation/criteria";
import { PROFILES } from "../simulation/profiles";
import { runSimulation } from "../simulation/run-simulation";

const costs = { recognition: 12, listening: 16, production: 22, pronunciation: 24 };
const words = Array.from({ length: 10 }, (_, index): NewWordCandidate => ({
  wordId: `c1k:new-${index + 1}`,
  rank: index + 1,
}));
const perNewWord = 10 + costs.recognition;
const noBacklogPolicy = deriveBaseBacklogPolicy({
  dailyBudgetSeconds: 900,
  modalityCosts: costs,
});

describe("admitNewWords", () => {
  // 30% safety reserve is applied to remainingSeconds before dividing by
  // perNewWordSeconds — pad the input so exactly 4 fit after the reserve.
  const roomFor4 = 4 * perNewWord / 0.7;

  it("respeta el techo de capacidad derivado de segundos disponibles", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: roomFor4,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: noBacklogPolicy,
    });

    expect(result.admitted).toHaveLength(4);
    expect(result.capacitySafeNewWords).toBe(4);
    expect(result.newReservations).toHaveLength(8);
  });

  it("el límite configurado sigue siendo un máximo sobre la capacidad segura", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 2,
      remainingSeconds: roomFor4,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: noBacklogPolicy,
    });

    expect(result.capacitySafeNewWords).toBe(4);
    expect(result.admitted).toHaveLength(2);
    expect(result.newReservations).toHaveLength(4);
    expect(result.limitingFactor).toBe("target");
  });

  it("sin segundos disponibles no admite ninguna", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: 0,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: noBacklogPolicy,
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
    expect(result.limitingFactor).toBe("budget");
  });

  it("el backlog de skills existentes reduce las palabras nuevas", () => {
    const heavyBacklogPolicy = deriveBaseBacklogPolicy({
      dailyBudgetSeconds: 900,
      modalityCosts: costs,
    });
    const withoutBacklog = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: 10 * perNewWord,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: heavyBacklogPolicy,
    });
    const withBacklog = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: 10 * perNewWord,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: heavyBacklogPolicy.admissionBackpressureThresholdSeconds * 2,
      backlogPolicy: heavyBacklogPolicy,
    });

    expect(withBacklog.admitted.length).toBeLessThan(withoutBacklog.admitted.length);
    expect(withBacklog.limitingFactor).toBe("pending-base-backpressure");
  });

  it("cada palabra admitida reserva listening y production dentro de C9", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      remainingSeconds: 10 * perNewWord,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: noBacklogPolicy,
    });

    for (const word of result.admitted) {
      const reservations = result.newReservations
        .filter((reservation) => reservation.itemId.startsWith(`${word.wordId}#`));
      expect(reservations.map((reservation) => reservation.skill).sort())
        .toEqual(["listening", "production"]);
      expect(reservations.every((reservation) => reservation.deadlineSession <= 8))
        .toBe(true);
    }
  });
});

describe("planDailySession admission gate", () => {
  it("no depende exclusivamente de maxBaseActivations", () => {
    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 10,
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: words },
      estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: [],
        mandatory: [],
        dueReservations: [],
        futureReservations: [],
      },
    };
    const limits: ActivationLimits = {
      absoluteBaseActivationSafetyCeiling: 100,
      maxUsageActivationsPerSession: 100,
      maxPerItemPerSession: 1,
    };

    const plan = planDailySession(input, limits, DEFAULT_RECOVERY_POLICY);
    expect(plan.newWordsSelected.length).toBeGreaterThan(0);
  });

  it("las palabras admitidas cumplen C9 en una simulación controlada", () => {
    const result = runSimulation(PROFILES.steady, {
      days: 90,
      corpusSize: 80,
      seed: 42,
      startAt: "2026-08-01T00:00:00.000Z",
      dailyBudgetSeconds: 900,
      targetNewWords: 4,
    });

    expect(baseSkillActivationLiveness(result.eligibility, 8))
      .toMatchObject({ passed: true });
    expect(result.worldCounts.activeListening).toBe(result.worldCounts.introducedWords);
    expect(result.worldCounts.activeProduction).toBe(result.worldCounts.introducedWords);
  });
});
