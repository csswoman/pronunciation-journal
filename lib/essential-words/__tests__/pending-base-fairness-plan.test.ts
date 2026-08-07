import { describe, expect, it } from "vitest";
import { planDailySession, DEFAULT_ACTIVATION_LIMITS } from "../daily-budget";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";
import type {
  ActivationCandidate,
  DailyPlanningInput,
  ForecastSessionCapacity,
} from "../planning-types";
import {
  C9_BASE_ACTIVATION_LIMIT,
  rankPendingBaseCandidates,
  toPendingBaseCandidate,
} from "../pending-base-fairness";

const costs = {
  recognition: 12,
  listening: 20,
  production: 25,
  pronunciation: 30,
};

function sessions(budget = 900): ForecastSessionCapacity[] {
  return Array.from({ length: 8 }, (_, index) => ({
    sessionOffset: index + 1,
    availableSeconds: budget,
    listeningSeconds: budget,
    productionSeconds: budget,
  }));
}

function base(
  itemId: string,
  skill: "listening" | "production",
  waitSessions: number,
): ActivationCandidate {
  return toPendingBaseCandidate({
    itemId,
    wordId: itemId.split("#")[0]!,
    skill,
    modality: skill,
    waitSessions,
    deadlineSession: C9_BASE_ACTIVATION_LIMIT - waitSessions,
  });
}

function planningInput(
  overrides: Partial<DailyPlanningInput> = {},
): DailyPlanningInput {
  return {
    dailyBudgetSeconds: 900,
    configuredNewWordLimit: 10,
    mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
    candidates: {
      baseSkillActivations: [],
      usageActivations: [],
      newWords: [],
    },
    estimatedSeconds: { byModality: costs, newWordIntroduction: 10 },
    consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
    previousMode: "normal",
    capacityForecast: {
      sessions: sessions(),
      mandatory: [],
      dueReservations: [],
      futureReservations: [],
    },
    ...overrides,
  };
}

describe("fairness integration in planDailySession", () => {
  it("J: fairness no excede presupuesto", () => {
    const candidates = Array.from({ length: 20 }, (_, index) => (
      base(`c1k:w${index}#listening`, "listening", index % 8)
    ));
    const plan = planDailySession(planningInput({
      dailyBudgetSeconds: 50,
      candidates: {
        baseSkillActivations: candidates,
        usageActivations: [],
        newWords: [],
      },
    }), DEFAULT_ACTIVATION_LIMITS, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.plannedSeconds).toBeLessThanOrEqual(50);
  });

  it("K: fairness no desplaza hard mandatory", () => {
    const plan = planDailySession(planningInput({
      dailyBudgetSeconds: 40,
      mandatory: {
        learning: [],
        overdue: [{
          itemId: "c1k:m#meaning",
          wordId: "c1k:m",
          skill: "meaning",
          modality: "recognition",
          dueAt: "2026-01-01T00:00:00.000Z",
          retrievability: 0.2,
        }],
        dueToday: [],
        provisionalDue: [],
      },
      candidates: {
        baseSkillActivations: [
          base("c1k:old#listening", "listening", 7),
          base("c1k:old2#production", "production", 7),
        ],
        usageActivations: [],
        newWords: [],
      },
    }), DEFAULT_ACTIVATION_LIMITS, DEFAULT_RECOVERY_POLICY);

    expect(plan.mandatorySelected.map((item) => item.itemId)).toContain("c1k:m#meaning");
    expect(plan.allowance.plannedSeconds).toBeLessThanOrEqual(40);
  });

  it("L: con capacidad suficiente, pending base se sirve por fairness (C9<=8)", () => {
    const candidates = [
      base("c1k:a#listening", "listening", 7),
      base("c1k:b#production", "production", 6),
      base("c1k:c#listening", "listening", 1),
      base("c1k:d#production", "production", 0),
    ];
    const ranked = rankPendingBaseCandidates(
      candidates.map((item) => toPendingBaseCandidate(item)),
    );
    const plan = planDailySession(planningInput({
      candidates: {
        baseSkillActivations: candidates,
        usageActivations: [],
        newWords: [],
      },
    }), {
      maxBaseSkillActivationsPerSession: 4,
      maxUsageActivationsPerSession: 1,
      maxPerItemPerSession: 1,
    }, DEFAULT_RECOVERY_POLICY);

    expect(plan.baseSkillSelected.map((item) => item.itemId))
      .toEqual(ranked.slice(0, 4).map((item) => item.itemId));
    expect(plan.baseSkillSelected.every((item) => (
      (item.waitSessions ?? 0) <= C9_BASE_ACTIVATION_LIMIT
    ))).toBe(true);
  });

  it("O: mismo seed/config produce mismo scheduling", () => {
    const candidates = [
      base("c1k:z#listening", "listening", 3),
      base("c1k:a#production", "production", 3),
      base("c1k:m#listening", "listening", 5),
    ];
    const input = planningInput({
      candidates: {
        baseSkillActivations: candidates,
        usageActivations: [],
        newWords: [],
      },
    });
    const first = planDailySession(input, DEFAULT_ACTIVATION_LIMITS, DEFAULT_RECOVERY_POLICY);
    const second = planDailySession(input, DEFAULT_ACTIVATION_LIMITS, DEFAULT_RECOVERY_POLICY);
    expect(second.baseSkillSelected).toEqual(first.baseSkillSelected);
  });
});
