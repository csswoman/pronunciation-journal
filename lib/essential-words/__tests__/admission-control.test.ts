import { describe, expect, it } from "vitest";
import { admitNewWords } from "../admission-control";
import { buildCapacityForecast } from "../capacity-forecast";
import { planDailySession } from "../daily-budget";
import type {
  ActivationLimits,
  CapacityReservation,
  DailyPlanningInput,
  ForecastSessionCapacity,
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

function fourPairSessions(): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => {
    const listening = index % 2 === 0;
    return {
      sessionOffset: index + 1,
      availableSeconds: listening ? costs.listening : costs.production,
      listeningSeconds: listening ? costs.listening : 0,
      productionSeconds: listening ? 0 : costs.production,
    };
  });
}

function readyForecast(
  sessions: ForecastSessionCapacity[] = fourPairSessions(),
  pendingBase: CapacityReservation[] = [],
) {
  return buildCapacityForecast({
    sessions,
    mandatory: [],
    pendingBase,
    futureReservations: [],
  });
}

describe("admitNewWords", () => {
  it("límite 10 y capacidad para cuatro pares admite exactamente cuatro", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      forecast: readyForecast(),
      estimatedSecondsByModality: costs,
    });

    expect(result.admitted).toHaveLength(4);
    expect(result.capacitySafeNewWords).toBe(4);
    expect(result.newReservations).toHaveLength(8);
  });

  it("el límite configurado sigue siendo un máximo sobre la capacidad segura", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 2,
      forecast: readyForecast(),
      estimatedSecondsByModality: costs,
    });

    expect(result.capacitySafeNewWords).toBe(4);
    expect(result.admitted).toHaveLength(2);
    expect(result.newReservations).toHaveLength(4);
  });

  it("hace rollback atómico si listening cabe pero production está lleno", () => {
    const onlyListening = Array.from({ length: 8 }, (_, index) => ({
      sessionOffset: index + 1,
      availableSeconds: 100,
      listeningSeconds: 100,
      productionSeconds: 0,
    }));
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      forecast: readyForecast(onlyListening),
      estimatedSecondsByModality: costs,
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
  });

  it("el backlog de skills existentes reduce las palabras nuevas", () => {
    const openSessions = Array.from({ length: 8 }, (_, index) => ({
      sessionOffset: index + 1,
      availableSeconds: 100,
      listeningSeconds: 100,
      productionSeconds: 100,
    }));
    const pending = Array.from({ length: 8 }, (_, index): CapacityReservation => ({
      itemId: `c1k:pending-${index}#production`,
      source: "pending-base",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: 80,
    }));
    const withoutBacklog = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      forecast: readyForecast(openSessions),
      estimatedSecondsByModality: costs,
    });
    const withBacklog = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      forecast: readyForecast(openSessions, pending),
      estimatedSecondsByModality: costs,
    });

    expect(withBacklog.admitted.length).toBeLessThan(withoutBacklog.admitted.length);
  });

  it("cada palabra admitida reserva listening y production dentro de C9", () => {
    const result = admitNewWords({
      candidates: words,
      configuredNewWordLimit: 10,
      forecast: readyForecast(),
      estimatedSecondsByModality: costs,
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
    const forecast = Array.from({ length: 8 }, (_, index) => ({
      sessionOffset: index + 1,
      availableSeconds: 900,
      listeningSeconds: 900,
      productionSeconds: 0,
    }));
    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 10,
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: words },
      estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: forecast,
        mandatory: [],
        dueReservations: [],
        futureReservations: [],
      },
    };
    const limits: ActivationLimits = {
      maxBaseSkillActivationsPerSession: 100,
      maxUsageActivationsPerSession: 100,
      maxPerItemPerSession: 1,
    };

    expect(planDailySession(input, limits, DEFAULT_RECOVERY_POLICY).newWordsSelected)
      .toEqual([]);
  });

  it("las palabras admitidas cumplen C9 en una simulación controlada", () => {
    const result = runSimulation(PROFILES.steady, {
      days: 60,
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
