import { describe, expect, it } from "vitest";
import {
  PROVISIONAL_WINDOWS,
  provisionalDueAt,
} from "../provisional-intervals";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const daysBetween = (from: Date, to: Date) =>
  Math.round((to.getTime() - from.getTime()) / 86_400_000);

describe("provisionalDueAt", () => {
  it("verificación directa Easy cae en la ventana 14-30 días", () => {
    const due = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);
    const days = daysBetween(NOW, due);

    expect(days).toBeGreaterThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].minDays);
    expect(days).toBeLessThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("la inferencia de banda usa una ventana más corta que la evidencia directa", () => {
    expect(PROVISIONAL_WINDOWS.inference.maxDays)
      .toBeLessThan(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("Good cae en el extremo bajo de la ventana de Easy", () => {
    expect(PROVISIONAL_WINDOWS["direct-good"].maxDays)
      .toBeLessThanOrEqual(PROVISIONAL_WINDOWS["direct-easy"].maxDays);
  });

  it("es determinista para el mismo ítem y origen", () => {
    const first = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);
    const second = provisionalDueAt("direct-easy", "c1k:on#meaning", NOW);

    expect(first.toISOString()).toBe(second.toISOString());
  });

  it("distribuye distintos ítems en varios días", () => {
    const ids = Array.from({ length: 40 }, (_, index) => `c1k:w${index}#meaning`);
    const days = new Set(ids.map((id) =>
      daysBetween(NOW, provisionalDueAt("inference", id, NOW)),
    ));

    expect(days.size).toBeGreaterThanOrEqual(8);
  });

  it("no usa estado ni aleatoriedad entre procesos", () => {
    const first = provisionalDueAt("inference", "c1k:the#listening", NOW).toISOString();
    const second = provisionalDueAt("inference", "c1k:the#listening", NOW).toISOString();

    expect(first).toBe(second);
  });
});
