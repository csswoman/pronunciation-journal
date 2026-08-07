import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { planDailySession, selectMandatory } from "../daily-budget";
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

const planned = (
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

const candidate = (
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
  estimatedSeconds: {
    byModality: DEFAULT_SECONDS_BY_MODALITY,
    newWordIntroduction: 10,
  },
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

describe("selectMandatory", () => {
  it("prioriza learning, luego atrasados, y por último lo que vence hoy", () => {
    const result = selectMandatory({
      learning: [planned("c1k:learning#meaning", "recognition", "2026-08-02T00:00:00.000Z")],
      overdue: [planned("c1k:older#meaning", "recognition", "2026-08-01T00:00:00.000Z", 0.3)],
      provisionalDue: [planned("c1k:newer#meaning", "recognition", "2026-08-03T00:00:00.000Z", 0.4)],
      dueToday: [planned("c1k:today#meaning", "recognition", "2026-08-06T00:00:00.000Z")],
    }, 100, DEFAULT_SECONDS_BY_MODALITY);

    expect(result.selected.map((item) => item.itemId)).toEqual([
      "c1k:learning#meaning",
      "c1k:older#meaning",
      "c1k:newer#meaning",
      "c1k:today#meaning",
    ]);
  });

  it("acepta un primer obligatorio indivisible y difiere los posteriores", () => {
    const result = selectMandatory({
      learning: [planned("c1k:slow#meaning", "production")],
      overdue: [planned("c1k:next#meaning")],
      dueToday: [],
      provisionalDue: [],
    }, 10, DEFAULT_SECONDS_BY_MODALITY);

    expect(result.seconds).toBe(DEFAULT_SECONDS_BY_MODALITY.production);
    expect(result.selected).toHaveLength(1);
    expect(result.deferred.map((item) => item.itemId)).toEqual(["c1k:next#meaning"]);
  });
});

describe("planDailySession", () => {
  it("2 base y 3 nuevas no se convierten en 5 activaciones base", () => {
    const plan = planDailySession(input({
      candidates: {
        baseSkillActivations: Array.from({ length: 5 }, (_, index) =>
          candidate(`c1k:base-${index}#meaning`)),
        usageActivations: [],
        newWords: [newWord("c1k:new-1", 1), newWord("c1k:new-2", 2), newWord("c1k:new-3", 3)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.baseSkillSelected).toHaveLength(2);
    expect(plan.newWordsSelected).toHaveLength(3);
    expect(plan.allowance).toMatchObject({
      baseSkillActivations: 2,
      newWordMeaningActivations: 3,
      totalSkillActivations: 5,
    });
  });

  it("acota varias horas de deuda, mantiene los diferidos y bloquea lo negociable", () => {
    const overdue = Array.from({ length: 20 }, (_, index) =>
      planned(`c1k:overdue-${index}#meaning`, "production", `2026-08-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`));
    const plan = planDailySession(input({
      dailyBudgetSeconds: 100,
      mandatory: { learning: [], overdue, dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [candidate("c1k:base#meaning")],
        usageActivations: [candidate("c1k:usage#usage")],
        newWords: [newWord("c1k:new", 1)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.mode).toBe("recovery");
    expect(plan.mandatorySelected).toHaveLength(4);
    expect(plan.deferredMandatory).toHaveLength(16);
    expect(plan).toMatchObject({ baseSkillSelected: [], usageSelected: [], newWordsSelected: [] });
    expect(plan.deferredMandatory[0]).toMatchObject({
      itemId: overdue[4].itemId,
      dueAt: overdue[4].dueAt,
    });
  });

  it("replanificar sin completar conserva el backlog y su edad", () => {
    const overdue = Array.from({ length: 6 }, (_, index) =>
      planned(`c1k:overdue-${index}#meaning`, "production", `2026-07-${String(index + 1).padStart(2, "0")}T00:00:00.000Z`));
    const planningInput = input({
      dailyBudgetSeconds: 50,
      mandatory: { learning: [], overdue, dueToday: [], provisionalDue: [] },
    });

    const first = planDailySession(planningInput, limits, DEFAULT_RECOVERY_POLICY);
    const second = planDailySession(planningInput, limits, DEFAULT_RECOVERY_POLICY);

    expect(second.deferredMandatory).toEqual(first.deferredMandatory);
    expect(second.deferredMandatory[0].dueAt).toBe(overdue[2].dueAt);
  });

  it("selecciona dos listening de palabras distintas, pero nunca duplica un itemId", () => {
    const plan = planDailySession(input({
      candidates: {
        baseSkillActivations: [
          candidate("c1k:one#listening", "listening"),
          candidate("c1k:one#listening", "listening"),
          candidate("c1k:two#listening", "listening"),
        ],
        usageActivations: [],
        newWords: [],
      },
    }), { ...limits, absoluteBaseActivationSafetyCeiling: 3 }, DEFAULT_RECOVERY_POLICY);

    expect(plan.baseSkillSelected.map((item) => item.itemId)).toEqual([
      "c1k:one#listening",
      "c1k:two#listening",
    ]);
  });

  it("respeta activaciones ya consumidas en la sesión", () => {
    const plan = planDailySession(input({
      consumed: { baseSkillActivations: 1, usageActivations: 1, newWords: 0 },
      candidates: {
        baseSkillActivations: [candidate("c1k:first#meaning"), candidate("c1k:second#meaning")],
        usageActivations: [candidate("c1k:usage#usage")],
        newWords: [],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.baseSkillSelected).toHaveLength(1);
    expect(plan.usageSelected).toHaveLength(0);
  });

  it("mantiene el modo en la banda de histéresis y sale con el umbral inferior", () => {
    const middle = Array.from({ length: 5 }, (_, index) => planned(`c1k:mid-${index}#meaning`));
    const middleInput = input({
      dailyBudgetSeconds: 50,
      mandatory: { learning: [], overdue: middle, dueToday: [], provisionalDue: [] },
    });
    const exitInput = input({
      dailyBudgetSeconds: 50,
      previousMode: "recovery",
      mandatory: {
        learning: [],
        overdue: Array.from({ length: 3 }, (_, index) => planned(`c1k:exit-${index}#meaning`)),
        dueToday: [],
        provisionalDue: [],
      },
    });

    expect(planDailySession({ ...middleInput, previousMode: "normal" }, limits, DEFAULT_RECOVERY_POLICY)
      .allowance.mode).toBe("normal");
    expect(planDailySession({ ...middleInput, previousMode: "recovery" }, limits, DEFAULT_RECOVERY_POLICY)
      .allowance.mode).toBe("recovery");
    expect(planDailySession(exitInput, limits, DEFAULT_RECOVERY_POLICY).allowance.mode).toBe("normal");
  });

  it("suma los costes de cada selección materializada", () => {
    const plan = planDailySession(input({
      dailyBudgetSeconds: 100,
      mandatory: { learning: [planned("c1k:due#meaning")], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [candidate("c1k:base#production", "production")],
        usageActivations: [candidate("c1k:usage#usage", "listening")],
        newWords: [newWord("c1k:new", 1)],
      },
    }), limits, DEFAULT_RECOVERY_POLICY);

    expect(plan.allowance.plannedSeconds).toBe(79);
  });
});
