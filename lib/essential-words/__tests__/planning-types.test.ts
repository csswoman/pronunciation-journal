import { describe, expect, it } from "vitest";
import { emptyLoadBreakdown } from "../planning-load";
import type {
  DailyAllowance,
  DailyPlan,
  DailyPlanningInput,
  PlannedItem,
} from "../planning-types";

const plannedItem = (itemId: string): PlannedItem => ({
  itemId,
  wordId: itemId.split("#")[0],
  skill: "meaning",
  modality: "recognition",
  dueAt: "2026-08-06T00:00:00.000Z",
});

describe("unidades del plan diario", () => {
  it("separa base, meaning implícito y usage", () => {
    const allowance: DailyAllowance = {
      newWords: 3,
      capacitySafeNewWords: 3,
      baseSkillActivations: 2,
      newWordMeaningActivations: 3,
      usageActivations: 1,
      totalSkillActivations: 5,
      plannedSeconds: 780,
      mode: "normal",
    };

    expect(allowance.totalSkillActivations).toBe(
      allowance.baseSkillActivations + allowance.newWordMeaningActivations,
    );
    expect(allowance.baseSkillActivations).toBe(2);
    expect(allowance.usageActivations).toBe(1);
  });

  it("DailyPlan conserva obligatorios diferidos sin perder sus IDs", () => {
    const selected = plannedItem("c1k:on#meaning");
    const deferred = plannedItem("c1k:the#meaning");
    const plan: DailyPlan = {
      mandatorySelected: [selected],
      deferredMandatory: [deferred],
      baseSkillSelected: [],
      usageSelected: [],
      newWordsSelected: [],
      placementSelected: [],
      placementDeferred: 0,
      futureReservations: [],
      loadBreakdown: emptyLoadBreakdown(),
      allowance: {
        newWords: 0,
        capacitySafeNewWords: 0,
        baseSkillActivations: 0,
        newWordMeaningActivations: 0,
        usageActivations: 0,
        totalSkillActivations: 0,
        plannedSeconds: 0,
        mode: "recovery",
      },
    };

    expect([...plan.mandatorySelected, ...plan.deferredMandatory].map((item) => item.itemId))
      .toEqual([selected.itemId, deferred.itemId]);
  });

  it("el input transporta consumo de la sesión", () => {
    const consumed: DailyPlanningInput["consumed"] = {
      baseSkillActivations: 1,
      usageActivations: 0,
      newWords: 2,
    };

    expect(consumed.newWords).toBe(2);
  });

  it("no expone unidades ambiguas", () => {
    const allowance: DailyAllowance = {
      newWords: 0,
      capacitySafeNewWords: 0,
      baseSkillActivations: 0,
      usageActivations: 0,
      newWordMeaningActivations: 0,
      totalSkillActivations: 0,
      plannedSeconds: 0,
      mode: "normal",
    };

    expect(allowance).not.toHaveProperty("skillActivations");
    expect(allowance).not.toHaveProperty("newItemsAllowed");
  });
});
