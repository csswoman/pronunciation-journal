import { describe, expect, it } from "vitest";
import { DEFAULT_SECONDS_BY_MODALITY } from "../cost-estimate";
import type { PlannedItem } from "../planning-types";
import {
  backlogSeconds,
  DEFAULT_RECOVERY_POLICY,
  resolveMode,
} from "../recovery-mode";

const item = (modality: PlannedItem["modality"] = "recognition"): PlannedItem => ({
  itemId: `c1k:x#meaning-${modality}`,
  wordId: "c1k:x",
  skill: "meaning",
  modality,
  dueAt: "2026-08-01T00:00:00.000Z",
});

const BUDGET = 900;

describe("backlogSeconds", () => {
  it("incluye las tres fuentes: FSRS atrasados, provisionales vencidos y learning steps", () => {
    const seconds = backlogSeconds(
      { learning: [item()], overdue: [item()], provisionalDue: [item()], dueToday: [] },
      DEFAULT_SECONDS_BY_MODALITY,
    );

    expect(seconds).toBe(DEFAULT_SECONDS_BY_MODALITY.recognition * 3);
  });

  it("no cuenta lo que vence hoy: eso es carga normal, no deuda", () => {
    const seconds = backlogSeconds(
      { learning: [], overdue: [], provisionalDue: [], dueToday: [item(), item()] },
      DEFAULT_SECONDS_BY_MODALITY,
    );

    expect(seconds).toBe(0);
  });
});

describe("resolveMode", () => {
  it("entra en recuperación al superar el ratio de entrada", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio + 1;

    expect(resolveMode(backlog, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("recovery");
  });

  it("no entra justo por debajo del umbral", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio - 1;

    expect(resolveMode(backlog, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("sale solo al bajar del ratio de salida, más exigente", () => {
    const backlog = BUDGET * DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio - 1;

    expect(resolveMode(backlog, BUDGET, "recovery", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("no oscila: en la banda intermedia mantiene el modo anterior", () => {
    const mid = BUDGET * (
      (DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio
        + DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio) / 2
    );

    expect(resolveMode(mid, BUDGET, "recovery", DEFAULT_RECOVERY_POLICY)).toBe("recovery");
    expect(resolveMode(mid, BUDGET, "normal", DEFAULT_RECOVERY_POLICY)).toBe("normal");
  });

  it("usa umbrales distintos para la histéresis", () => {
    expect(DEFAULT_RECOVERY_POLICY.exitAtBacklogBudgetRatio)
      .toBeLessThan(DEFAULT_RECOVERY_POLICY.enterAtBacklogBudgetRatio);
  });

  it("sin modo previo arranca en normal salvo que el backlog obligue", () => {
    expect(resolveMode(0, BUDGET, undefined, DEFAULT_RECOVERY_POLICY)).toBe("normal");
    expect(resolveMode(BUDGET * 5, BUDGET, undefined, DEFAULT_RECOVERY_POLICY)).toBe("recovery");
  });
});
