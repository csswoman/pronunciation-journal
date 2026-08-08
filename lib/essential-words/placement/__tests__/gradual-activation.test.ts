import { describe, expect, it } from "vitest";

import type { LearningItem } from "../../verification/types";
import { convertInferences, DEFAULT_CONVERSIONS_PER_DAY } from "../policy";

const NOW = new Date("2026-08-06T10:00:00.000Z");

const inferred = (count: number): LearningItem[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `c1k:w${index}#meaning`,
    wordId: `c1k:w${index}`,
    skill: "meaning" as const,
    contentOrigin: "authored" as const,
    schedule: { kind: "none" as const },
    placementInference: {
      bandId: "band-1",
      confidence: 0.9,
      inferredAt: "2026-08-01T00:00:00.000Z",
      policyVersion: "band-v1",
    },
    repetitions: 0,
    lapses: 0,
    suspended: false,
  }));

describe("convertInferences", () => {
  it("respeta el límite diario de conversiones (invariante 11)", () => {
    const converted = convertInferences(inferred(500), DEFAULT_CONVERSIONS_PER_DAY, NOW);

    expect(converted).toHaveLength(DEFAULT_CONVERSIONS_PER_DAY);
  });

  it("los convertidos pasan a provisional con source placement-inference", () => {
    const converted = convertInferences(inferred(10), 5, NOW);

    for (const item of converted) {
      expect(item.schedule.kind).toBe("provisional");
      if (item.schedule.kind === "provisional") {
        expect(item.schedule.source).toBe("placement-inference");
      }
    }
  });

  it("hereda la confianza de la banda como evidenceConfidence", () => {
    const [first] = convertInferences(inferred(1), 1, NOW);

    if (first.schedule.kind !== "provisional") throw new Error("expected provisional");
    expect(first.schedule.evidenceConfidence).toBe(0.9);
  });

  it("distribuye los vencimientos: no caen todos el mismo día", () => {
    const converted = convertInferences(inferred(30), 30, NOW);
    const days = new Set(converted.map((item) =>
      item.schedule.kind === "provisional" ? item.schedule.dueAt.slice(0, 10) : ""));

    expect(days.size).toBeGreaterThanOrEqual(7);
  });

  it("conserva placementInference como telemetría tras convertir", () => {
    const [first] = convertInferences(inferred(1), 1, NOW);

    expect(first.placementInference?.bandId).toBe("band-1");
  });

  it("ignora ítems ya programados: no reconvierte", () => {
    const already = inferred(3).map((item) => ({
      ...item,
      schedule: {
        kind: "provisional" as const,
        dueAt: "2026-08-20T10:00:00.000Z",
        source: "placement-inference" as const,
        evidenceConfidence: 0.9,
      },
    }));

    expect(convertInferences(already, 10, NOW)).toHaveLength(0);
  });

  it("ignora ítems sin inferencia", () => {
    const plain = inferred(3).map((item) => ({ ...item, placementInference: undefined }));

    expect(convertInferences(plain, 10, NOW)).toHaveLength(0);
  });
});
