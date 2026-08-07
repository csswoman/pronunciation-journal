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
  exactPairSessions,
  inferred,
  NOW,
  openSessions,
  readyForecast,
} from "./capacity-reservations.fixtures";

describe("admitPlacementConversions — admisión atómica", () => {
  it("A: no convierte si una pending base preexistente incumpliría C9", () => {
    const pendingBase: CapacityReservation[] = [{
      itemId: "c1k:pending#listening",
      source: "pending-base",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    }, {
      itemId: "c1k:pending#production",
      source: "pending-base",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: costs.production,
    }];
    const forecast = readyForecast(exactPairSessions(), pendingBase);
    expect(forecast.unreservedItemIds).toEqual([]);

    const result = admit({
      candidates: inferred(3),
      forecast,
      maxConversionsPerSession: 3,
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
    expect(result.forecast.reservations.map((item) => item.itemId).sort()).toEqual([
      "c1k:pending#listening",
      "c1k:pending#production",
    ]);
  });

  it("B: no convierte si listening/production no caben en ocho sesiones", () => {
    const noProduction = openSessions(100).map((session) => ({
      ...session,
      productionSeconds: 0,
    }));
    const result = admit({
      candidates: inferred(2),
      forecast: readyForecast(noProduction),
    });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
  });

  it("C: una conversión admitida deja todas sus reservas dentro del deadline", () => {
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
    expect(result.newReservations.some((item) => item.itemId === `${wordId}#meaning`)).toBe(true);
  });

  it("D: fallo de una reserva revierte todas las de esa conversión", () => {
    const sessions = openSessions(0).map((session, index) => (
      index === 0
        ? {
            ...session,
            availableSeconds: costs.listening,
            listeningSeconds: costs.listening,
            productionSeconds: 0,
          }
        : session
    ));
    const before = readyForecast(sessions);
    const result = admit({ candidates: inferred(1), forecast: before });

    expect(result.admitted).toEqual([]);
    expect(result.newReservations).toEqual([]);
    expect(result.forecast.sessions).toEqual(before.sessions);
    expect(result.forecast.reservations).toEqual(before.reservations);
  });

  it("E: dos conversiones caben cuando hay capacidad suficiente", () => {
    const result = admit({
      candidates: inferred(4),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(500)),
    });

    expect(result.admitted.length).toBeGreaterThanOrEqual(2);
    expect(result.newReservations.length).toBeGreaterThanOrEqual(4);
  });

  it("F: maxConversionsPerSession es techo, no obligación de llenarlo", () => {
    const limited = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 2,
      forecast: readyForecast(openSessions(500)),
    });
    const saturated = admit({
      candidates: inferred(10),
      maxConversionsPerSession: 8,
      forecast: readyForecast(openSessions(costs.listening + costs.production)),
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
        sessions: exactPairSessions(),
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
    expect(plan.newWordsSelected).toEqual([]);
    expect(plan.futureReservations.some((item) => item.source === "placement")).toBe(true);
  });

  it("H: el mismo itemId no se contabiliza como pending base + placement", () => {
    const itemId = "c1k:w0#listening";
    const forecast = readyForecast(openSessions(500), [{
      itemId,
      source: "pending-base",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    }], [{
      itemId,
      source: "placement",
      skill: "listening",
      deadlineSession: 4,
      estimatedSeconds: costs.listening,
    }]);
    expect(forecast.reservations.filter((item) => item.itemId === itemId)).toHaveLength(1);
    expect(forecast.reservations.find((item) => item.itemId === itemId)?.source).toBe("placement");

    const result = admit({
      candidates: inferred(1),
      forecast,
      maxConversionsPerSession: 1,
    });
    expect(result.forecast.reservations.filter((item) => item.itemId === itemId))
      .toHaveLength(1);
  });
});
