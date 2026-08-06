import { describe, expect, it } from "vitest";

import { BAND_COUNT, buildBands, sampleForPlacement, SAMPLES_PER_BAND } from "../bands";
import type { EssentialWord } from "../../types";

const corpus = (count: number): EssentialWord[] =>
  Array.from({ length: count }, (_, index) => ({
    word: `word${index}`,
    rank: index + 1,
    cefr_level: "A1",
    pos: index % 3 === 0 ? "noun" : index % 3 === 1 ? "verb" : "adjective",
    translation: `t${index}`,
    meaning: `m${index}`,
    example_sentence: `s${index}`,
  } as EssentialWord));

describe("buildBands", () => {
  it("parte el corpus en bandas de frecuencia", () => {
    expect(buildBands(corpus(1000))).toHaveLength(BAND_COUNT);
  });

  it("las bandas están ordenadas de más a menos frecuente", () => {
    const bands = buildBands(corpus(1000));
    const firstRanks = bands.map((band) => band.words[0].rank);

    expect([...firstRanks].sort((a, b) => a - b)).toEqual(firstRanks);
  });

  it("un corpus pequeño no revienta: produce bandas más pequeñas", () => {
    expect(() => buildBands(corpus(10))).not.toThrow();
  });
});

describe("sampleForPlacement", () => {
  it("toma unas 5 palabras por banda", () => {
    const sample = sampleForPlacement(corpus(1000), 42);

    expect(sample.length).toBeLessThanOrEqual(BAND_COUNT * SAMPLES_PER_BAND);
    expect(sample.length).toBeGreaterThan(0);
  });

  it("evita varias palabras de la misma familia", () => {
    const family = [
      { word: "develop", rank: 100 },
      { word: "developer", rank: 101 },
      { word: "development", rank: 102 },
      { word: "unrelated", rank: 103 },
    ].map((word) => ({
      ...word,
      cefr_level: "B1",
      pos: "verb",
      translation: "t",
      meaning: "m",
      example_sentence: "s",
    } as EssentialWord));
    const sample = sampleForPlacement(family, 7);
    const stems = sample.map((word) => word.word.slice(0, 6));

    expect(new Set(stems).size).toBe(stems.length);
  });

  it("estratifica por parte de la oración", () => {
    const sample = sampleForPlacement(corpus(1000), 42);
    const posSet = new Set(sample.map((word) => word.pos));

    expect(posSet.size).toBeGreaterThan(1);
  });

  it("es determinista con la misma semilla", () => {
    const first = sampleForPlacement(corpus(500), 99).map((word) => word.word);
    const second = sampleForPlacement(corpus(500), 99).map((word) => word.word);

    expect(first).toEqual(second);
  });

  it("semillas distintas dan muestras distintas", () => {
    const first = sampleForPlacement(corpus(500), 1).map((word) => word.word);
    const second = sampleForPlacement(corpus(500), 2).map((word) => word.word);

    expect(first).not.toEqual(second);
  });
});
