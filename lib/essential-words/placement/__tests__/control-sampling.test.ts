import { describe, expect, it } from "vitest";

import type { LearningItem } from "../../verification/types";
import { CONTROL_RATE, pickControlSamples, recalibrateConfidence } from "../control-sampling";

const fastTracked = (count: number, bandId = "band-1"): LearningItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `c1k:w${index}#meaning`,
    wordId: `c1k:w${index}`,
    skill: "meaning" as const,
    contentOrigin: "authored" as const,
    schedule: {
      kind: "provisional" as const,
      dueAt: "2026-08-20T00:00:00.000Z",
      source: "placement-inference" as const,
      evidenceConfidence: 0.9,
    },
    placementInference: {
      bandId,
      confidence: 0.9,
      inferredAt: "2026-08-01T00:00:00.000Z",
      policyVersion: "band-v1",
    },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  }));

describe("pickControlSamples", () => {
  it("verifica 1-2 de cada 20 fast-tracked", () => {
    const picked = pickControlSamples(fastTracked(20), 42);

    expect(picked.length).toBeGreaterThanOrEqual(1);
    expect(picked.length).toBeLessThanOrEqual(2);
  });

  it("escala con el volumen", () => {
    const picked = pickControlSamples(fastTracked(100), 42);

    expect(picked.length).toBeGreaterThanOrEqual(Math.floor(100 * CONTROL_RATE));
  });

  it("es determinista con la misma semilla", () => {
    const first = pickControlSamples(fastTracked(60), 7).map((item) => item.id);
    const second = pickControlSamples(fastTracked(60), 7).map((item) => item.id);

    expect(first).toEqual(second);
  });

  it("solo elige ítems con inferencia de banda", () => {
    const mixed = [
      ...fastTracked(10),
      ...fastTracked(10).map((item) => ({ ...item, placementInference: undefined })),
    ];

    expect(pickControlSamples(mixed, 3).every((item) => item.placementInference)).toBe(true);
  });
});

describe("recalibrateConfidence", () => {
  it("baja la confianza de una banda con muchos fallos", () => {
    const next = recalibrateConfidence(0.9, { checked: 10, failed: 6 });

    expect(next).toBeLessThan(0.9);
  });

  it("mantiene la confianza si el control confirma la inferencia", () => {
    const next = recalibrateConfidence(0.9, { checked: 10, failed: 0 });

    expect(next).toBeGreaterThanOrEqual(0.9);
  });

  it("nunca sale del rango 0-1", () => {
    expect(recalibrateConfidence(0.9, { checked: 10, failed: 10 })).toBeGreaterThanOrEqual(0);
    expect(recalibrateConfidence(0.99, { checked: 10, failed: 0 })).toBeLessThanOrEqual(1);
  });

  it("sin muestras no cambia nada: no recalibra a ciegas", () => {
    expect(recalibrateConfidence(0.9, { checked: 0, failed: 0 })).toBe(0.9);
  });
});
