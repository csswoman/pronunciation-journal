import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import { planDailySession } from "../daily-budget";
import { buildSkillQueue } from "../skill-queue";
import { emptyLoadBreakdown } from "../planning-load";
import type {
  ActivationCandidate,
  ActivationLimits,
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
  NewWordCandidate,
  PlannedItem,
} from "../planning-types";
import { DEFAULT_RECOVERY_POLICY } from "../recovery-mode";

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
  skill: itemId.includes("#usage") ? "usage" : modality === "listening" ? "listening" : "meaning",
  modality,
});

const newWord = (wordId: string, rank: number): NewWordCandidate => ({ wordId, rank });

const allowance = (overrides: Partial<DailyAllowance> = {}): DailyAllowance => ({
  newWords: 0,
  capacitySafeNewWords: 0,
  baseSkillActivations: 0,
  usageActivations: 0,
  newWordMeaningActivations: 0,
  totalSkillActivations: 0,
  plannedSeconds: 0,
  mode: "normal",
  ...overrides,
});

const plan = (overrides: Partial<DailyPlan> = {}): DailyPlan => ({
  allowance: allowance(),
  mandatorySelected: [],
  deferredMandatory: [],
  baseSkillSelected: [],
  usageSelected: [],
  newWordsSelected: [],
  placementSelected: [],
  placementDeferred: 0,
  futureReservations: [],
  loadBreakdown: emptyLoadBreakdown(),
  ...overrides,
});

const limits: ActivationLimits = {
  absoluteBaseActivationSafetyCeiling: 1,
  maxUsageActivationsPerSession: 1,
  maxPerItemPerSession: 1,
};

describe("buildSkillQueue", () => {
  it("preserva los seis tramos materializados", () => {
    const queue = buildSkillQueue({ plan: plan({
      mandatorySelected: [
        mandatory("c1k:learning#meaning"),
        mandatory("c1k:overdue#meaning", "production"),
        mandatory("c1k:today#meaning", "listening"),
      ],
      baseSkillSelected: [activation("c1k:base#listening", "listening")],
      usageSelected: [activation("c1k:usage#usage", "production")],
      newWordsSelected: [newWord("c1k:new", 1)],
    }) });

    expect(queue.map((item) => item.itemId)).toEqual([
      "c1k:learning#meaning",
      "c1k:overdue#meaning",
      "c1k:today#meaning",
      "c1k:base#listening",
      "c1k:usage#usage",
      "c1k:new#meaning",
    ]);
  });

  it("preserva la urgencia y antigüedad ya seleccionadas", () => {
    const urgent = mandatory("c1k:urgent#meaning", "recognition", "2026-08-02T00:00:00.000Z", 0.1);
    const older = mandatory("c1k:older#meaning", "recognition", "2026-08-01T00:00:00.000Z", 0.2);
    const queue = buildSkillQueue({ plan: plan({ mandatorySelected: [urgent, older] }) });

    expect(queue).toEqual([urgent, older]);
  });

  it("no usa totalSkillActivations para recortar activaciones base", () => {
    const base = Array.from({ length: 4 }, (_, index) => activation(`c1k:base-${index}#meaning`));
    const queue = buildSkillQueue({ plan: plan({
      allowance: allowance({ totalSkillActivations: 1 }),
      baseSkillSelected: base,
    }) });

    expect(queue.map((item) => item.itemId)).toEqual(base.map((item) => item.itemId));
  });

  it("en recovery excluye diferidos y activaciones negociables", () => {
    const selected = mandatory("c1k:due#meaning");
    const queue = buildSkillQueue({ plan: plan({
      allowance: allowance({ mode: "recovery" }),
      mandatorySelected: [selected],
      deferredMandatory: [mandatory("c1k:deferred#meaning")],
      baseSkillSelected: [activation("c1k:base#meaning")],
      usageSelected: [activation("c1k:usage#usage")],
      newWordsSelected: [newWord("c1k:new", 1)],
    }) });

    expect(queue).toEqual([selected]);
  });

  it("deduplica IDs sin cambiar la prioridad del primer tramo", () => {
    const required = mandatory("c1k:on#meaning");
    const queue = buildSkillQueue({ plan: plan({
      mandatorySelected: [required],
      baseSkillSelected: [activation("c1k:on#meaning"), activation("c1k:listening#listening", "listening")],
      usageSelected: [activation("c1k:listening#listening", "listening")],
      newWordsSelected: [newWord("c1k:on", 1), newWord("c1k:new", 2)],
    }) });

    expect(queue.map((item) => item.itemId)).toEqual([
      "c1k:on#meaning",
      "c1k:listening#listening",
      "c1k:new#meaning",
    ]);
  });

  it("mantiene la duración planificada como suma de las selecciones", () => {
    // Fase 8 final simplification: admitir una palabra nueva reserva
    // capacidad también contra su costo amortizado de listening+production+
    // review futuro (encargo §7a). Presupuesto 900 (en vez de 100) deja
    // margen real para admitir la palabra sin cambiar lo que este test
    // verifica: la cola tiene 4 ítems y `plannedSeconds` es la suma exacta.
    const planningInput: DailyPlanningInput = {
      dailyBudgetSeconds: 900,
      configuredNewWordLimit: 10,
      mandatory: { learning: [mandatory("c1k:due#meaning")], overdue: [], dueToday: [], provisionalDue: [] },
      candidates: {
        baseSkillActivations: [activation("c1k:base#meaning", "production")],
        usageActivations: [activation("c1k:usage#usage", "listening")],
        newWords: [newWord("c1k:new", 1)],
      },
      estimatedSeconds: { byModality: DEFAULT_SECONDS_BY_MODALITY, newWordIntroduction: 10 },
      consumed: { baseSkillActivations: 0, usageActivations: 0, newWords: 0 },
      previousMode: "normal",
      capacityForecast: {
        sessions: [],
        mandatory: [],
        dueReservations: [],
        futureReservations: [],
      },
    };
    const queuePlan = planDailySession(planningInput, limits, DEFAULT_RECOVERY_POLICY);

    const queue = buildSkillQueue({ plan: queuePlan });
    expect(queue).toHaveLength(4);
    const expected = DEFAULT_SECONDS_BY_MODALITY.recognition // mandatory
      + DEFAULT_SECONDS_BY_MODALITY.production // base
      + DEFAULT_SECONDS_BY_MODALITY.listening // usage
      + (10 + DEFAULT_SECONDS_BY_MODALITY.recognition); // new word immediate cost
    expect(queuePlan.allowance.plannedSeconds).toBe(expected);
  });
});
