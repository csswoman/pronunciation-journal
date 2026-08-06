import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { fixedExecutionContext } from "../../execution-context";
import type { EssentialWord } from "../../types";
import {
  classifyBandConfidence,
  planInferences,
  PLACEMENT_POLICY_VERSION,
  type BandResult,
} from "../policy";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const word = (value: string): EssentialWord => ({
  word: value,
  rank: 1,
  cefr_level: "A1",
  pos: "noun",
  translation: "traducción",
  meaning: "meaning",
  example_sentence: `A sentence with ${value}.`,
} as EssentialWord);

const result = (overrides: Partial<BandResult> = {}): BandResult => ({
  bandId: "band-1",
  words: [word("on")],
  attempted: 5,
  correct: 4,
  ...overrides,
});

describe("classifyBandConfidence", () => {
  it("distingue evidencia alta, fronteriza y baja", () => {
    expect(classifyBandConfidence(result({ correct: 4 }))).toBe("high");
    expect(classifyBandConfidence(result({ correct: 3 }))).toBe("borderline");
    expect(classifyBandConfidence(result({ correct: 2 }))).toBe("low");
  });

  it("sin respuestas no infiere confianza", () => {
    expect(classifyBandConfidence(result({ attempted: 0, correct: 0 }))).toBe("low");
  });
});

describe("planInferences", () => {
  it("crea las tres habilidades base e infiere solo meaning con alta confianza", () => {
    const items = planInferences([result()], fixedExecutionContext(NOW, []));
    const bySkill = new Map(items.map((item) => [item.skill, item]));

    expect(items).toHaveLength(3);
    expect([...bySkill.keys()].sort()).toEqual(["listening", "meaning", "production"]);
    expect(items.every((item) => item.schedule.kind === "none")).toBe(true);
    expect(bySkill.get("meaning")?.placementInference).toEqual({
      bandId: "band-1",
      confidence: 0.8,
      inferredAt: NOW.toISOString(),
      policyVersion: PLACEMENT_POLICY_VERSION,
    });
    expect(bySkill.get("listening")?.placementInference).toBeUndefined();
    expect(bySkill.get("production")?.placementInference).toBeUndefined();
  });

  it("no adelanta una banda fronteriza", () => {
    const items = planInferences([result({ correct: 3 })], fixedExecutionContext(NOW, []));

    expect(items).toHaveLength(3);
    expect(items.every((item) => item.placementInference === undefined)).toBe(true);
  });

  it("usa los IDs canónicos de los ítems", () => {
    const items = planInferences([result()], fixedExecutionContext(NOW, []));

    expect(items.map((item) => item.id).sort()).toEqual([
      "c1k:on#listening",
      "c1k:on#meaning",
      "c1k:on#production",
    ]);
  });

  it("es determinista con la misma entrada y contexto", () => {
    const bands = [result(), result({ bandId: "band-2", words: [word("at")] })];
    const first = planInferences(bands, fixedExecutionContext(NOW, []));
    const second = planInferences(bands, fixedExecutionContext(NOW, []));

    expect(first).toEqual(second);
  });

  it("no consulta el reloj global", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib", "essential-words", "placement", "policy.ts"),
      "utf8",
    );

    expect(source).not.toMatch(/new Date\(\)/);
    expect(source).not.toMatch(/Date\.now\(\)/);
  });
});
