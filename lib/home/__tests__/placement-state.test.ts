import { beforeEach, describe, expect, it, vi } from "vitest";

const results = vi.hoisted(() => new Map<string, { count: number | null; error: { code?: string } | null }>());

function builder(result: { count: number | null; error: { code?: string } | null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    gt: () => chain,
    then: (resolve: (value: typeof result) => unknown) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: (table: string) => builder(results.get(table) ?? { count: 0, error: null }),
  }),
}));

import { getHomePlacementState } from "../placement-state";
import { getHomePronunciationDiagnosticState } from "../pronunciation-diagnostic-state";

describe("getHomePlacementState", () => {
  beforeEach(() => {
    results.clear();
  });

  it("recognizes a completed placement independently from profile CEFR", async () => {
    results.set("assessment_results", { count: 1, error: null });

    await expect(getHomePlacementState("u1")).resolves.toEqual({
      hasPlacement: true,
      hasMeaningfulProgress: false,
    });
  });

  it("recognizes meaningful practice without a placement", async () => {
    results.set("answer_history", { count: 2, error: null });

    await expect(getHomePlacementState("u1")).resolves.toEqual({
      hasPlacement: false,
      hasMeaningfulProgress: true,
    });
  });

  it("tolerates installations without assessment_results", async () => {
    results.set("assessment_results", { count: null, error: { code: "PGRST205" } });

    await expect(getHomePlacementState("u1")).resolves.toEqual({
      hasPlacement: false,
      hasMeaningfulProgress: false,
    });
  });
});

describe("getHomePronunciationDiagnosticState", () => {
  beforeEach(() => {
    results.clear();
  });

  it("is false when neither CEFR placement nor pronunciation diagnostic exist", async () => {
    await expect(getHomePronunciationDiagnosticState("u1")).resolves.toEqual({
      hasPronunciationDiagnostic: false,
    });
  });

  it("recognizes a completed pronunciation diagnostic independently from CEFR placement", async () => {
    results.set("assessment_results", { count: 1, error: null });
    results.set("pronunciation_assessments", { count: 1, error: null });

    await expect(getHomePronunciationDiagnosticState("u1")).resolves.toEqual({
      hasPronunciationDiagnostic: true,
    });
  });

  it("stays false with only CEFR placement completed (no default CEFR misread)", async () => {
    results.set("assessment_results", { count: 1, error: null });

    await expect(getHomePronunciationDiagnosticState("u1")).resolves.toEqual({
      hasPronunciationDiagnostic: false,
    });
  });

  it("is true with only the pronunciation diagnostic completed", async () => {
    results.set("pronunciation_assessments", { count: 1, error: null });

    await expect(getHomePronunciationDiagnosticState("u1")).resolves.toEqual({
      hasPronunciationDiagnostic: true,
    });
  });

  it("tolerates installations without pronunciation_assessments", async () => {
    results.set("pronunciation_assessments", { count: null, error: { code: "PGRST205" } });

    await expect(getHomePronunciationDiagnosticState("u1")).resolves.toEqual({
      hasPronunciationDiagnostic: false,
    });
  });
});
