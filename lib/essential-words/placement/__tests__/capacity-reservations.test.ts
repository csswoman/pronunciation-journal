import { describe, expect, it } from "vitest";
import { planDailySession } from "../../daily-budget";
import type {
  ActivationLimits,
  CapacityReservation,
  DailyPlanningInput,
} from "../../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../../recovery-mode";
import {
  activeDates,
  admit,
  costs,
  DEFAULT_BACKLOG_POLICY,
  inferred,
  NOW,
} from "./capacity-reservations.fixtures";

/**
 * Fase 8 final simplification (docs/superpowers/plans/notes/
 * 2026-08-07-fase8-final-planner-simplification.md §7c). Reescrito contra el
 * nuevo contrato de backpressure — los tests originales fijaban aritmética
 * exacta de un solver de 8 sesiones que ya no existe; estos preservan el
 * MISMO invariante (atomicidad listening+production, backpressure de
 * backlog, `maxConversionsPerSession` como techo, no doble contabilidad)
 * contra el mecanismo simplificado.
 */
describe("admitPlacementConversions — admisión con backpressure", () => {
  it("A: backlog de pending-base saturado reduce (o anula) la admisión de placement", () => {
    const result = admit({
      candidates: inferred(3),
      pendingBaseBacklogSeconds: DEFAULT_BACKLOG_POLICY.admissionBackpressureThresholdSeconds * 2,
    });

    expect(result.admitted.length).toBe(0);
    expect(result.newReservations).toEqual([]);
  });

  it("B: sin segundos disponibles no convierte", () => {
    const result = admit({
      candidates: inferred(2),
      remainingSeconds: 0,
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
  });

  it("C: una conversión admitida crea reservas listening+production dentro del deadline", () => {
    const result = admit({
      candidates: inferred(1),
      maxConversionsPerSession: 1,
    });

    expect(result.admitted).toHaveLength(1);
    const wordId = result.admitted[0].wordId;
    const derived = result.newReservations.filter((item) => (
      item.itemId.startsWith(`${wordId}#`)
      && (item.skill === "listening" || item.skill === "production")
    ));
    expect(derived.map((item) => item.skill).sort())
      .toEqual(["listening", "production"]);
    expect(derived.every((item) => item.source === "placement")).toBe(true);
    expect(derived.every((item) => item.deadlineSession <= 8)).toBe(true);
    expect(result.admitted[0].schedule.kind).toBe("provisional");
  });

  it("D: sin segundos, ninguna conversión deja reservas parciales", () => {
    const result = admit({
      candidates: inferred(1),
      remainingSeconds: 0,
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
  });

  it("E: varias conversiones caben cuando hay capacidad suficiente", () => {
    const result = admit({
      candidates: inferred(4),
      maxConversionsPerSession: 8,
      remainingSeconds: 900,
    });

    expect(result.admitted.length).toBeGreaterThanOrEqual(2);
    expect(result.newReservations.length).toBeGreaterThanOrEqual(4);
  });

  it("F: maxConversionsPerSession es techo, no obligación de llenarlo", () => {
    const limited = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 2,
      remainingSeconds: 900,
    });
    const saturated = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 8,
      remainingSeconds: costs.recognition * 1.5,
    });

    expect(limited.admitted).toHaveLength(2);
    expect(limited.capacitySafeConversions).toBeGreaterThanOrEqual(2);
    expect(saturated.admitted.length).toBeLessThan(8);
    expect(saturated.admitted.length).toBe(saturated.capacitySafeConversions);
  });

  it("G: placement tiene prioridad sobre nuevas palabras tras pending base", () => {
    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 10,
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [],
        usageActivations: [],
        newWords: Array.from({ length: 10 }, (_, index) => ({
          wordId: `c1k:new-${index}`,
          rank: index + 1,
        })),
        placementCandidates: inferred(3),
      },
      estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: [],
        mandatory: [],
        dueReservations: [],
        futureReservations: [],
      },
      placementContext: {
        now: NOW,
        maxConversionsPerSession: 3,
        activeSessionDates: activeDates(),
      },
    };
    const limits: ActivationLimits = {
      absoluteBaseActivationSafetyCeiling: 2,
      maxUsageActivationsPerSession: 1,
      maxPerItemPerSession: 1,
    };
    const plan = planDailySession(input, limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.placementSelected.length).toBeGreaterThan(0);
    expect(plan.futureReservations.some((item) => item.source === "placement")).toBe(true);
  });

  it("H: el mismo itemId no se contabiliza dos veces en futureReservations", () => {
    const itemId = "c1k:w0#listening";
    const pendingBase: CapacityReservation = {
      itemId,
      source: "pending-base",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    };
    const placementReservation: CapacityReservation = {
      itemId,
      source: "placement",
      skill: "listening",
      deadlineSession: 4,
      estimatedSeconds: costs.listening,
    };

    const input: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 0,
      mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
      estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: [],
        mandatory: [],
        dueReservations: [pendingBase],
        futureReservations: [placementReservation],
      },
    };
    const limits: ActivationLimits = {
      absoluteBaseActivationSafetyCeiling: 24,
      maxUsageActivationsPerSession: 1,
      maxPerItemPerSession: 1,
    };
    const plan = planDailySession(input, limits, DEFAULT_RECOVERY_POLICY);
    expect(plan.futureReservations.filter((item) => item.itemId === itemId)).toHaveLength(1);
  });
});
