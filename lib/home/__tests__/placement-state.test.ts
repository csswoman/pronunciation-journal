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
