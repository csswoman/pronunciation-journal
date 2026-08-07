import { describe, expect, it } from "vitest";
import {
  backlogStable,
  budgetRespected,
  noSynchronizedPeaks,
  percentile95WithinBudget,
  recoveryExits,
  recoveryReturnSessions,
} from "../criteria";
import type { SimulatedDay } from "../run-simulation";
import { emptyForecastTelemetry } from "../forecast-telemetry";

function day(overrides: Partial<SimulatedDay> = {}): SimulatedDay {
  return {
    date: "2026-08-01T00:00:00.000Z",
    active: true,
    dailyBudgetSeconds: 100,
    plannedSeconds: 100,
    completedSeconds: 100,
    plannedItems: 5,
    completedItems: 5,
    mandatorySelected: 2,
    deferredMandatory: 0,
    backlogSeconds: 50,
    mode: "normal",
    newWords: 2,
    baseSkillActivations: 2,
    newWordMeaningActivations: 2,
    usageActivations: 1,
    provisionalDue: 1,
    placementCandidates: 0,
    placementConversions: 0,
    placementConversionsDeferred: 0,
    placementReservedSeconds: 0,
    placementListeningReservations: 0,
    placementProductionReservations: 0,
    provisionalDueDistribution: {},
    scheduledReviews: 2,
    correctScheduledReviews: 2,
    oldestDeferredAgeSessions: 0,
    listeningEligibleWaiting: 0,
    productionEligibleWaiting: 0,
    ...emptyForecastTelemetry(),
    ...overrides,
  };
}

describe("criterios de presupuesto", () => {
  it("criterio 1 exige 90 % de sesiones activas dentro de 1.2x", () => {
    const passing = [
      ...Array.from({ length: 9 }, () => day()),
      day({ plannedSeconds: 130 }),
      day({ active: false, plannedSeconds: 10_000 }),
    ];
    const failing = [
      ...Array.from({ length: 8 }, () => day()),
      day({ plannedSeconds: 130 }),
      day({ plannedSeconds: 140 }),
    ];

    expect(budgetRespected(passing, 100)).toMatchObject({ passed: true, measured: 0.9 });
    expect(budgetRespected(failing, 100)).toMatchObject({ passed: false, measured: 0.8 });
    expect(budgetRespected([day({ active: false })], 100).detail).toContain("no active");
  });

  it("criterio 2 usa p95 nearest-rank de sesiones activas", () => {
    const passing = [
      ...Array.from({ length: 19 }, () => day()),
      day({ plannedSeconds: 200 }),
    ];
    const failing = [
      ...Array.from({ length: 18 }, () => day()),
      day({ plannedSeconds: 180 }),
      day({ plannedSeconds: 200 }),
    ];

    expect(percentile95WithinBudget(passing, 100)).toMatchObject({
      passed: true,
      measured: 100,
      limit: 150,
    });
    expect(percentile95WithinBudget(failing, 100)).toMatchObject({
      passed: false,
      measured: 180,
    });
  });
});

describe("criterios de recovery y backlog", () => {
  it("criterio 3 aprueba sin recovery y falla si queda atrapado", () => {
    expect(recoveryExits([day(), day()])).toMatchObject({ passed: true, measured: 0 });
    expect(recoveryExits([
      day({ mode: "recovery" }),
      day({ mode: "recovery" }),
    ])).toMatchObject({ passed: false });
    expect(recoveryExits([
      day({ mode: "recovery" }),
      day({ mode: "normal" }),
    ])).toMatchObject({ passed: true, measured: 1 });
  });

  it("criterio 4 exige pendiente no positiva y backlog final bajo el techo", () => {
    const passing = [100, 80, 60, 40].map((backlogSeconds) => day({ backlogSeconds }));
    const growing = [20, 40, 70, 120].map((backlogSeconds) => day({ backlogSeconds }));
    const highFinal = [500, 400, 300].map((backlogSeconds) => day({ backlogSeconds }));

    expect(backlogStable(passing, 0, 2, 100)).toMatchObject({ passed: true });
    expect(backlogStable(growing, 0, 2, 100)).toMatchObject({ passed: false });
    expect(backlogStable(highFinal, 0, 2, 100)).toMatchObject({ passed: false });
  });

  it("criterio 5 cuenta sesiones activas para volver tras una ausencia larga", () => {
    const absence = Array.from({ length: 10 }, () => day({ active: false }));
    const passing = [
      ...absence,
      day({ mode: "recovery" }),
      day({ mode: "recovery" }),
      day({ mode: "normal" }),
    ];
    const failing = [
      ...absence,
      ...Array.from({ length: 15 }, () => day({ mode: "recovery" })),
      day({ mode: "normal" }),
    ];

    expect(recoveryReturnSessions(passing, 14)).toMatchObject({ passed: true, measured: 3 });
    expect(recoveryReturnSessions(failing, 14)).toMatchObject({ passed: false, measured: 16 });
  });
});

describe("criterio de picos sincronizados", () => {
  it("criterio 7 falla solo con ambos picos y carga superior a 1.5x", () => {
    const baseline = Array.from({ length: 4 }, () => day({
      plannedSeconds: 100,
      provisionalDue: 2,
      usageActivations: 2,
    }));
    const synchronized = day({
      plannedSeconds: 160,
      provisionalDue: 4,
      usageActivations: 4,
    });
    const bounded = day({
      plannedSeconds: 140,
      provisionalDue: 4,
      usageActivations: 4,
    });

    expect(noSynchronizedPeaks([...baseline, synchronized], 100))
      .toMatchObject({ passed: false, measured: 1 });
    expect(noSynchronizedPeaks([...baseline, bounded], 100))
      .toMatchObject({ passed: true, measured: 0 });
  });
});
