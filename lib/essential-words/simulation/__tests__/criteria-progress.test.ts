import { describe, expect, it } from "vitest";
import {
  baseSkillActivationLiveness,
  newWordLiveness,
  noOverdueStarvation,
  usageActivationShare,
  type DeferredObservation,
  type EligibilityObservation,
} from "../criteria";
import type { SimulatedDay } from "../run-simulation";

function day(overrides: Partial<SimulatedDay> = {}): SimulatedDay {
  return {
    date: "2026-08-01T00:00:00.000Z",
    active: true,
    dailyBudgetSeconds: 100,
    plannedSeconds: 80,
    completedSeconds: 80,
    plannedItems: 5,
    completedItems: 5,
    mandatorySelected: 1,
    deferredMandatory: 0,
    backlogSeconds: 20,
    mode: "normal",
    newWords: 3,
    baseSkillActivations: 5,
    newWordMeaningActivations: 3,
    usageActivations: 2,
    provisionalDue: 0,
    placementCandidates: 0,
    placementConversions: 0,
    placementConversionsDeferred: 0,
    placementReservedSeconds: 0,
    placementListeningReservations: 0,
    placementProductionReservations: 0,
    provisionalDueDistribution: {},
    scheduledReviews: 1,
    correctScheduledReviews: 1,
    oldestDeferredAgeSessions: 0,
    listeningEligibleWaiting: 0,
    productionEligibleWaiting: 0,
    ...overrides,
  };
}

function eligibleForSessions(
  itemId: string,
  skill: EligibilityObservation["skill"],
  sessions: number,
  activateAt?: number,
): EligibilityObservation[] {
  return Array.from({ length: sessions }, (_, sessionIndex) => ({
    itemId,
    skill,
    sessionIndex,
    eligible: true,
    scheduleKind: activateAt !== undefined && sessionIndex >= activateAt ? "fsrs" : "none",
    cumulativeAvailableSeconds: (sessionIndex + 1) * 30,
  }));
}

function deferredForSessions(
  itemId: string,
  sessions: number,
  selectedAt?: number,
): DeferredObservation[] {
  return Array.from({ length: sessions }, (_, sessionIndex) => ({
    itemId,
    sessionIndex,
    tranche: "overdue",
    dueAt: "2026-08-01T00:00:00.000Z",
    eligible: true,
    selected: selectedAt === sessionIndex,
    suspended: false,
  }));
}

describe("cuota usage y palabras nuevas", () => {
  it("criterio 6 evalúa ventanas móviles con denominador suficiente", () => {
    const passing = Array.from({ length: 7 }, () => day({
      baseSkillActivations: 8,
      newWordMeaningActivations: 2,
      usageActivations: 2,
    }));
    const failing = Array.from({ length: 7 }, () => day({
      baseSkillActivations: 4,
      newWordMeaningActivations: 1,
      usageActivations: 5,
    }));

    expect(usageActivationShare(passing, 7, 10, 0.3)).toMatchObject({ passed: true });
    expect(usageActivationShare(failing, 7, 10, 0.3)).toMatchObject({
      passed: false,
      measured: 0.5,
    });
  });

  it("criterio 8 exige 60 % del objetivo solo con presión baja", () => {
    const passing = Array.from({ length: 4 }, () => day({ newWords: 3 }));
    const failing = Array.from({ length: 4 }, () => day({ newWords: 2 }));
    const excluded = day({ backlogSeconds: 90, newWords: 0 });

    expect(newWordLiveness([...passing, excluded], 5)).toMatchObject({
      passed: true,
      measured: 0.6,
    });
    expect(newWordLiveness(failing, 5)).toMatchObject({ passed: false, measured: 0.4 });
  });
});

describe("liveness por ítem", () => {
  it("criterio 9 pasa al activar y falla si listening nunca se activa", () => {
    const passing = [
      ...eligibleForSessions("c1k:on#listening", "listening", 10, 5),
      ...eligibleForSessions("c1k:on#production", "production", 10, 7),
    ];
    const failing = eligibleForSessions("c1k:on#listening", "listening", 20);

    expect(baseSkillActivationLiveness(passing, 8)).toMatchObject({ passed: true });
    const result = baseSkillActivationLiveness(failing, 8);
    expect(result).toMatchObject({ passed: false, measured: 20 });
    expect(result.detail).toContain("listening=20");
  });

  it("criterio 10 detecta un atrasado que nunca se selecciona", () => {
    const passing = deferredForSessions("c1k:on#meaning", 10, 5);
    const failing = deferredForSessions("c1k:on#meaning", 30);

    expect(noOverdueStarvation(passing, 12)).toMatchObject({ passed: true });
    const result = noOverdueStarvation(failing, 12);
    expect(result).toMatchObject({ passed: false, measured: 30 });
    expect(result.detail).toContain("c1k:on#meaning");
    expect(result.detail).toContain("tranche=overdue");
    expect(result.detail).toContain("dueAt=2026-08-01");
  });

  it("criterio 10 excluye una suspensión explícita", () => {
    const suspended = deferredForSessions("c1k:on#meaning", 30)
      .map((observation) => ({ ...observation, suspended: true }));

    expect(noOverdueStarvation(suspended, 12)).toMatchObject({
      passed: true,
      measured: 0,
    });
  });
});
