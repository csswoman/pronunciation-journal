import { describe, it, expect } from "vitest";
import { buildSessionQueue } from "../queue";
import { essentialWordId, type EssentialWord } from "../types";
import type { SRSData } from "@/lib/types";

const word = (w: string, rank: number): EssentialWord => ({
  word: w,
  rank,
  cefr_level: "A1",
  pos: "noun",
  translation: `${w}-es`,
  meaning: `${w}-meaning`,
  example_sentence: `A sentence with ${w}.`,
} as EssentialWord);

const due = (w: string): SRSData => ({
  wordId: essentialWordId(w),
  word: w,
  ease: 2.5,
  interval: 1,
  repetitions: 1,
  nextReview: "2026-08-01T00:00:00.000Z",
});

const NOW = new Date("2026-08-06T10:00:00.000Z");

describe("buildSessionQueue — caracterización del gating actual", () => {
  it("introduce newPerDay palabras nuevas sin importar cuántos repasos hay atrasados", () => {
    // 40 repasos vencidos. El gating actual los ignora por completo.
    const words = Array.from({ length: 60 }, (_, i) => word(`w${i}`, i));
    const srsEntries = words.slice(0, 40).map((w) => due(w.word));

    const queue = buildSessionQueue({
      words, srsEntries, introducedToday: [], now: NOW, newPerDay: 10,
    });

    expect(queue.filter((i) => i.kind === "review")).toHaveLength(40);
    // BUG documentado (spec §Problema, punto 3): mete 10 nuevas encima de 40 atrasados.
    expect(queue.filter((i) => i.kind === "new")).toHaveLength(10);
  });

  it("la cuota solo descuenta lo ya introducido hoy", () => {
    const words = Array.from({ length: 20 }, (_, i) => word(`w${i}`, i));
    const queue = buildSessionQueue({
      words, srsEntries: [], introducedToday: ["c1k:w0", "c1k:w1", "c1k:w2"],
      now: NOW, newPerDay: 10,
    });
    expect(queue.filter((i) => i.kind === "new")).toHaveLength(7);
  });

  it("ordena los repasos por frecuencia (rank), no por urgencia", () => {
    const words = [word("rare", 900), word("common", 3)];
    const srsEntries = [due("rare"), due("common")];
    const queue = buildSessionQueue({ words, srsEntries, introducedToday: [], now: NOW });
    // BUG documentado: 'common' va primero por rank bajo, no por recuperabilidad.
    expect(queue[0].entry.word).toBe("common");
  });
});
