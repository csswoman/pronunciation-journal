import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { planDailySession } from "../daily-budget";
import type {
  ActivationCandidate,
  ActivationLimits,
  DailyPlanningInput,
  NewWordCandidate,
  PlannedItem,
} from "../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";

const limits: ActivationLimits = {
  absoluteBaseActivationSafetyCeiling: 2,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

const mandatory = (
  itemId: string,
  modality: PlannedItem["modality"] = "recognition",
  dueAt = "2026-08-01T00:00:00.000Z",
  retrievability?: number,
): PlannedItem => ({
  itemId,
  wordId: itemId.split("#")[0],
  skill: "meaning",
  modality,
  dueAt,
  retrievability,
});

const activation = (
  itemId: string,
  modality: ActivationCandidate["modality"] = "recognition",
): ActivationCandidate => ({
  itemId,
  wordId: itemId.split("#")[0],
  skill: modality === "listening" ? "listening" : "meaning",
  modality,
});

const newWord = (wordId: string, rank: number): NewWordCandidate => ({ wordId, rank });

const input = (overrides: Partial<DailyPlanningInput> = {}): DailyPlanningInput => ({
  dailyBudgetSeconds: 900,
  configuredNewWordLimit: 10,
  mandatory: { learning: [], overdue: [], dueToday: [], provisionalDue: [] },
  candidates: { baseSkillActivations: [], usageActivations: [], newWords: [] },
  estimatedSeconds: { byModality: DEFAULT_SECONDS_BY_MODALITY, newWordIntroduction: 10 },
  consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
  previousMode: "normal",
  capacityForecast: {
    sessions: Array.from({ length: 8 }, (_, index) => ({
      sessionOffset: index + 1,
      availableSeconds: 900,
      listeningSeconds: 900,
      productionSeconds: 900,
    })),
    mandatory: [],
    dueReservations: [],
    futureReservations: [],
  },
  ...overrides,
});

describe("regresiones del gating por presupuesto", () => {
  it("40 atrasados bloquean nuevas y activaciones negociables", () => {
    const overdue = Array.from({ length: 40 }, (_, index) =>
      mandatory(`c1k:overdue-${index}#meaning`, "recognition"));
    const plan = planDailySession(input({
      dailyBudgetSeconds: 200,
      mandatory: { learning: [], overdue, dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [activation("c1k:base#meaning")],
        usageActivations: [activation("c1k:usage#meaning")],
        newWords: [newWord("c1k:new", 1)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.mode).toBe("recovery");
    expect(plan).toMatchObject({ baseSkillSelected: [], usageSelected: [], newWordsSelected: [] });
  });

  it("sin deuda existe progreso para base, usage y palabras nuevas", () => {
    const plan = planDailySession(input({
      candidates: {
        baseSkillActivations: [activation("c1k:base-1#meaning"), activation("c1k:base-2#meaning")],
        usageActivations: [activation("c1k:usage#meaning")],
        newWords: [newWord("c1k:new-1", 1), newWord("c1k:new-2", 2)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.mode).toBe("normal");
    expect(plan).toMatchObject({
      baseSkillSelected: [{ itemId: "c1k:base-1#meaning" }, { itemId: "c1k:base-2#meaning" }],
      usageSelected: [{ itemId: "c1k:usage#meaning" }],
      newWordsSelected: [{ wordId: "c1k:new-1" }, { wordId: "c1k:new-2" }],
    });
  });

  it("prioriza recuperabilidad y antigüedad, no frecuencia del vocabulario", () => {
    const plan = planDailySession(input({
      dailyBudgetSeconds: 30,
      mandatory: {
        learning: [],
        overdue: [
          mandatory("c1k:common#meaning", "recognition", "2026-08-01T00:00:00.000Z", 0.8),
          mandatory("c1k:rare#meaning", "recognition", "2026-07-01T00:00:00.000Z", 0.1),
        ],
        dueToday: [],
        provisionalDue: [],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.mandatorySelected.map((item) => item.wordId)).toEqual([
      "c1k:rare",
      "c1k:common",
    ]);
  });

  it("un backlog enorme muestra una sesión acotada y deja diferidos", () => {
    const overdue = Array.from({ length: 80 }, (_, index) =>
      mandatory(`c1k:overdue-${index}#meaning`, "production"));
    const plan = planDailySession(input({
      dailyBudgetSeconds: 100,
      mandatory: { learning: [], overdue, dueToday: [], provisionalDue: [] },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.plannedSeconds).toBeLessThanOrEqual(100);
    expect(plan.deferredMandatory).toHaveLength(76);
  });

  it("2 activaciones base y 3 nuevas no se convierten en 5 base", () => {
    const plan = planDailySession(input({
      candidates: {
        baseSkillActivations: Array.from({ length: 5 }, (_, index) =>
          activation(`c1k:base-${index}#meaning`)),
        usageActivations: [],
        newWords: [newWord("c1k:new-1", 1), newWord("c1k:new-2", 2), newWord("c1k:new-3", 3)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan).toMatchObject({
      baseSkillSelected: [{}, {}],
      newWordsSelected: [{}, {}, {}],
      allowance: { baseSkillActivations: 2, newWordMeaningActivations: 3, totalSkillActivations: 5 },
    });
  });

  it("no impone un límite global de un solo listening", () => {
    const plan = planDailySession(input({
      candidates: {
        baseSkillActivations: [
          activation("c1k:one#listening", "listening"),
          activation("c1k:two#listening", "listening"),
        ],
        usageActivations: [],
        newWords: [],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.baseSkillSelected.map((item) => item.itemId)).toEqual([
      "c1k:one#listening",
      "c1k:two#listening",
    ]);
  });

  it("los diferidos permanecen en el backlog al replanificar", () => {
    const overdue = Array.from({ length: 6 }, (_, index) =>
      mandatory(`c1k:overdue-${index}#meaning`, "production", `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`));
    const planningInput = input({
      dailyBudgetSeconds: 50,
      mandatory: { learning: [], overdue, dueToday: [], provisionalDue: [] },
    });

    const first = planDailySession(planningInput, limits, DEFAULT_RECOVERY_POLICY);
    const second = planDailySession(planningInput, limits, DEFAULT_RECOVERY_POLICY);

    expect(second.deferredMandatory).toEqual(first.deferredMandatory);
    expect(second.deferredMandatory.map((item) => item.itemId)).toEqual(
      overdue.slice(2).map((item) => item.itemId),
    );
  });
});
