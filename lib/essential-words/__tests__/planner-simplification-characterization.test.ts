import { describe, expect, it } from "vitest";
import { admitNewWords, admitPlacementConversions } from "../admission-control";
import { planDailySession } from "../daily-budget";
import { deriveBaseBacklogPolicy } from "../pending-base-fairness";
import type {
  ActivationLimits,
  DailyPlanningInput,
  ForecastSessionCapacity,
} from "../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";

/**
 * Tests de caracterización (nota 2026-08-07-fase8-final-planner-simplification.md
 * §5) — fijan el comportamiento OBSERVABLE de los invariantes 4, 7, 8 y 11
 * bajo el runtime simplificado (backpressure de backlog, sin ledger de 8
 * sesiones). Reemplazan la versión original de este archivo, que fijaba el
 * mismo comportamiento contra la API anterior (forecast-based); esa versión
 * quedó documentada en el commit que la introdujo (f542d22f) como línea base
 * pre-refactor. Las aserciones de invariante (no duplicados, backlog frena
 * admisión, liberar backlog la restaura, placement respeta la misma
 * backpressure) son las mismas — solo cambió el mecanismo bajo prueba.
 */

const costs = { recognition: 12, listening: 20, production: 25, pronunciation: 30 };
const perNewWord = 10 + costs.recognition;

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
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const result = admitNewWords({
      candidates: Array.from({ length: 6 }, (_, index) => ({ wordId: `c1k:w${index}`, rank: index })),
      configuredNewWordLimit: 6,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
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
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const candidates = Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index }));

    const withoutBacklog = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
    });
    const withBacklog = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 1.5,
      backlogPolicy: policy,
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
  it("capacitySafeNewWords sube cuando el backlog pasa de alto a bajo (misma capacidad)", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
    const candidates = Array.from({ length: 10 }, (_, index) => ({ wordId: `c1k:new-${index}`, rank: index + 1 }));

    const pressed = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.9,
      backlogPolicy: policy,
    });
    const relieved = admitNewWords({
      candidates,
      configuredNewWordLimit: 10,
      remainingSeconds: 900,
      perNewWordSeconds: perNewWord,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.1,
      backlogPolicy: policy,
    });

    expect(relieved.capacitySafeNewWords).toBeGreaterThan(pressed.capacitySafeNewWords);
  });
});

describe("Invariante 11 — placement no inunda pending base (misma backpressure)", () => {
  it("placement se reduce cuando el backlog de pending-base ya está saturado", () => {
    const policy = deriveBaseBacklogPolicy({ dailyBudgetSeconds: 900, modalityCosts: costs });
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

    const scarceResult = admitPlacementConversions({
      candidates: inferred,
      maxConversionsPerSession: 8,
      remainingSeconds: 900,
      perConversionSeconds: costs.recognition,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: policy.admissionBackpressureThresholdSeconds * 0.9,
      backlogPolicy: policy,
      now,
      activeSessionDates,
    });
    const roomyResult = admitPlacementConversions({
      candidates: inferred,
      maxConversionsPerSession: 8,
      remainingSeconds: 900,
      perConversionSeconds: costs.recognition,
      estimatedSecondsByModality: costs,
      pendingBaseBacklogSeconds: 0,
      backlogPolicy: policy,
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
