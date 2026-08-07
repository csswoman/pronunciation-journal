import { describe, expect, it } from "vitest";
import { admitNewWords, admitPlacementConversions } from "../admission-control";
import { applyAdmissionThroughputCap } from "../admission-capacity";
import { buildAdmissionLoadEnvelope } from "../admission-envelope";
import { buildCapacityForecast } from "../capacity-forecast";
import { planDailySession } from "../daily-budget";
import type {
  ActivationLimits,
  CapacityReservation,
  DailyPlanningInput,
  ForecastSessionCapacity,
} from "../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";

/**
 * Tests de caracterización (nota 2026-08-07-fase8-final-planner-simplification.md
 * §5) — fijan el comportamiento OBSERVABLE actual de los invariantes 4, 7, 8 y
 * 11 antes de simplificar el runtime. No prueban implementación (forecast de
 * 8 sesiones, reservas persistentes); prueban forma de la salida y relaciones
 * de orden que el runtime simplificado debe seguir cumpliendo.
 *
 * Tras la simplificación (PASO 2 del plan de ejecución) estos tests deben
 * seguir en verde SIN modificar sus aserciones — si alguno requiere cambiar,
 * es señal de que rompimos un invariante, no de que el test estaba mal.
 */

const costs = { recognition: 12, listening: 20, production: 25, pronunciation: 30 };

function sessions(available: number): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: available,
    listeningSeconds: available,
    productionSeconds: available,
  }));
}

function baseInput(overrides: Partial<DailyPlanningInput> = {}): DailyPlanningInput {
  return {
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
    },
    estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
    consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
    previousMode: "normal",
    capacityForecast: {
      sessions: sessions(900),
      mandatory: [],
      dueReservations: [],
      futureReservations: [],
    },
    ...overrides,
  };
}

const limits: ActivationLimits = {
  absoluteBaseActivationSafetyCeiling: 24,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

describe("Invariante 4 — no reservas/pending duplicados por itemId", () => {
  it("admitNewWords nunca produce dos reservas para el mismo itemId+skill", () => {
    const result = admitNewWords({
      candidates: Array.from({ length: 6 }, (_, index) => ({ wordId: `c1k:w${index}`, rank: index })),
      configuredNewWordLimit: 6,
      forecast: buildCapacityForecast({
        sessions: sessions(900),
        mandatory: [],
        pendingBase: [],
        futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
    });
    const keys = result.newReservations.map((r) => `${r.itemId}:${r.skill}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("planDailySession nunca deja itemIds repetidos en futureReservations", () => {
    const plan = planDailySession(baseInput(), limits, DEFAULT_RECOVERY_POLICY);
    const keys = plan.futureReservations.map((r) => `${r.itemId}:${r.skill}`);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("Invariante 7 — backlog alto frena nuevas palabras", () => {
  it("más backlog de pending-base reduce (o iguala) capacitySafeNewWords", () => {
    const openSessions = sessions(100);
    const heavyPending: CapacityReservation[] = Array.from({ length: 8 }, (_, index) => ({
      itemId: `c1k:pending-${index}#production`,
      source: "pending-base",
      skill: "production",
      deadlineSession: 8,
      estimatedSeconds: 80,
    }));

    const withoutBacklog = admitNewWords({
      candidates: Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index })),
      configuredNewWordLimit: 10,
      forecast: buildCapacityForecast({
        sessions: openSessions, mandatory: [], pendingBase: [], futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
    });
    const withBacklog = admitNewWords({
      candidates: Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index })),
      configuredNewWordLimit: 10,
      forecast: buildCapacityForecast({
        sessions: openSessions, mandatory: [], pendingBase: heavyPending, futureReservations: [],
      }),
      estimatedSecondsByModality: costs,
    });

    expect(withBacklog.admitted.length).toBeLessThan(withoutBacklog.admitted.length);
  });

  it("planDailySession: mucho pending-base pendiente reduce newWordsSelected frente a sin backlog", () => {
    const heavyPendingCandidates = Array.from({ length: 20 }, (_, index) => ({
      itemId: `c1k:base-${index}#listening`,
      wordId: `c1k:base-${index}`,
      skill: "listening" as const,
      modality: "listening" as const,
      waitSessions: 7,
      deadlineSession: 1,
    }));
    const tight = planDailySession(
      baseInput({
        dailyBudgetSeconds: 200,
        candidates: {
          baseSkillActivations: heavyPendingCandidates,
          usageActivations: [],
          newWords: Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index + 1 })),
        },
      }),
      limits,
      DEFAULT_RECOVERY_POLICY,
    );
    const roomy = planDailySession(
      baseInput({ dailyBudgetSeconds: 200 }),
      limits,
      DEFAULT_RECOVERY_POLICY,
    );
    expect(tight.newWordsSelected.length).toBeLessThanOrEqual(roomy.newWordsSelected.length);
  });
});

describe("Invariante 8 — al liberar backlog, nuevas palabras vuelven a admitirse", () => {
  it("capacitySafeNewWords sube cuando pending-base pasa de alto a bajo (misma capacidad)", () => {
    const openSessions = sessions(90);
    const heavyPending: CapacityReservation[] = Array.from({ length: 20 }, (_, index) => ({
      itemId: `c1k:pending-${index}#listening`,
      source: "pending-base",
      skill: "listening",
      deadlineSession: 2,
      estimatedSeconds: 45,
    }));
    const envelope = buildAdmissionLoadEnvelope({ costs, introductionSeconds: 10, horizonSessions: 8 });
    const candidates = Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index + 1 }));

    const pressed = buildCapacityForecast({
      sessions: openSessions, mandatory: [], pendingBase: heavyPending, futureReservations: [],
    });
    const relieved = buildCapacityForecast({
      sessions: openSessions, mandatory: [], pendingBase: heavyPending.slice(0, 1), futureReservations: [],
    });

    const pressedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: applyAdmissionThroughputCap(pressed, 4, costs),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
      introductionSeconds: 10,
    });
    const relievedAdmission = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      forecast: applyAdmissionThroughputCap(relieved, 4, costs),
      estimatedSecondsByModality: costs,
      admissionEnvelope: envelope,
      introductionSeconds: 10,
    });

    expect(relievedAdmission.capacitySafeNewWords)
      .toBeGreaterThan(pressedAdmission.capacitySafeNewWords);
  });
});

describe("Invariante 11 — placement no inunda pending base (misma backpressure)", () => {
  it("placement se reduce cuando pending-base preexistente ya está saturado", () => {
    const heavyPendingBase: CapacityReservation[] = Array.from({ length: 8 }, (_, index) => ({
      itemId: `c1k:pending-${index}#listening`,
      source: "pending-base",
      skill: "listening",
      deadlineSession: 8,
      estimatedSeconds: costs.listening,
    }));
    const inferred = Array.from({ length: 6 }, (_, index) => ({
      id: `c1k:inf-${index}#meaning`,
      wordId: `c1k:inf-${index}`,
      skill: "meaning" as const,
      contentOrigin: "authored" as const,
      schedule: { kind: "none" as const },
      placementInference: {
        bandId: "band-1",
        confidence: 0.9,
        inferredAt: "2026-08-01T00:00:00.000Z",
        policyVersion: "band-v1",
      },
      repetitions: 0,
      lapses: 0,
      suspended: false,
    }));
    const now = new Date("2026-08-06T10:00:00.000Z");
    const activeSessionDates = Array.from({ length: 30 }, (_, index) => (
      new Date(now.getTime() + (index + 1) * 86_400_000)
    ));

    const scarce = buildCapacityForecast({
      sessions: sessions(costs.listening + costs.production - 1),
      mandatory: [],
      pendingBase: heavyPendingBase,
      futureReservations: [],
    });
    const roomy = buildCapacityForecast({
      sessions: sessions(900),
      mandatory: [],
      pendingBase: [],
      futureReservations: [],
    });

    const scarceResult = admitPlacementConversions({
      candidates: inferred,
      maxConversionsPerSession: 8,
      forecast: scarce,
      estimatedSecondsByModality: costs,
      now,
      activeSessionDates,
    });
    const roomyResult = admitPlacementConversions({
      candidates: inferred,
      maxConversionsPerSession: 8,
      forecast: roomy,
      estimatedSecondsByModality: costs,
      now,
      activeSessionDates,
    });

    expect(scarceResult.admitted.length).toBeLessThanOrEqual(roomyResult.admitted.length);
  });

  it("planDailySession: placement admitido nunca excede maxConversionsPerSession", () => {
    const inferred = Array.from({ length: 10 }, (_, index) => ({
      id: `c1k:inf-${index}#meaning`,
      wordId: `c1k:inf-${index}`,
      skill: "meaning" as const,
      contentOrigin: "authored" as const,
      schedule: { kind: "none" as const },
      placementInference: {
        bandId: "band-1",
        confidence: 0.9,
        inferredAt: "2026-08-01T00:00:00.000Z",
        policyVersion: "band-v1",
      },
      repetitions: 0,
      lapses: 0,
      suspended: false,
    }));
    const now = new Date("2026-08-06T10:00:00.000Z");
    const activeSessionDates = Array.from({ length: 30 }, (_, index) => (
      new Date(now.getTime() + (index + 1) * 86_400_000)
    ));
    const plan = planDailySession(
      baseInput({
        candidates: {
          baseSkillActivations: [],
          usageActivations: [],
          newWords: [],
          placementCandidates: inferred,
        },
        placementContext: { now, maxConversionsPerSession: 3, activeSessionDates },
      }),
      limits,
      DEFAULT_RECOVERY_POLICY,
    );
    expect(plan.placementSelected.length).toBeLessThanOrEqual(3);
  });
});
