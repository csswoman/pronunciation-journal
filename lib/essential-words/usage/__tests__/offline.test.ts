import { describe, expect, it } from "vitest";
import { deriveUsageLifecycle } from "../../skill-item";
import { buildSkillQueue } from "../../skill-queue";
import type { DailyAllowance, DailyPlan } from "../../planning-types";
import { AUTHORED_ON_USAGES } from "./fixtures/authored-usage";

const allowance = (over: Partial<DailyAllowance> = {}): DailyAllowance => ({
  newWords: 0,
  capacitySafeNewWords: 0,
  baseSkillActivations: 0,
  usageActivations: 2,
  newWordMeaningActivations: 0,
  totalSkillActivations: 0,
  plannedSeconds: 0,
  mode: "normal",
  ...over,
});

const plan = (over: Partial<DailyPlan> = {}): DailyPlan => ({
  allowance: allowance(),
  mandatorySelected: [],
  deferredMandatory: [],
  baseSkillSelected: [],
  usageSelected: [],
  newWordsSelected: [],
  futureReservations: [],
  ...over,
});

describe("usage sin generación disponible", () => {
  it("un usage sin activar no entra en la cola", () => {
    expect(AUTHORED_ON_USAGES.every((item) => deriveUsageLifecycle(item) === "inactive")).toBe(true);
  });

  it("la sesión funciona igual sin ningún candidato usage", () => {
    const queue = buildSkillQueue({
      plan: plan({
        mandatorySelected: [{
          itemId: "c1k:on#meaning",
          wordId: "c1k:on",
          skill: "meaning",
          modality: "recognition",
          dueAt: "2026-08-01T00:00:00.000Z",
          retrievability: 0.4,
        }],
      }),
    });

    expect(queue).toHaveLength(1);
  });

  it("el contenido authored no necesita proveedor para ser válido", () => {
    expect(AUTHORED_ON_USAGES.every((item) => item.contentOrigin === "authored")).toBe(true);
    expect(AUTHORED_ON_USAGES.every((item) => item.generatorProvider === undefined)).toBe(true);
  });

  it("distingue context_usage de advanced_usage", () => {
    const kinds = new Set(AUTHORED_ON_USAGES.map((item) => item.payload?.usageKind));
    expect(kinds).toContain("context_usage");
    expect(kinds).toContain("advanced_usage");
  });
});
