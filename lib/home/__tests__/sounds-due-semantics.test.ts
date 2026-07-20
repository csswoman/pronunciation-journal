import { describe, it, expect, vi, beforeEach } from "vitest";

// server-only guard is irrelevant in unit tests
vi.mock("server-only", () => ({}));

const orCalls: string[] = [];
const lteCalls: Array<[string, string]> = [];

function builder(result: { data: unknown; error: null }) {
  const chain = {
    select: () => chain,
    eq: () => chain,
    or: (filter: string) => {
      orCalls.push(filter);
      return chain;
    },
    lte: (column: string, value: string) => {
      lteCalls.push([column, value]);
      return chain;
    },
    order: () => chain,
    limit: () => chain,
    in: () => chain,
    then: (resolve: (value: typeof result) => unknown) =>
      Promise.resolve(result).then(resolve),
  };
  return chain;
}

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => builder({ data: [], error: null }),
  }),
}));

import { getSoundsDueForHome } from "@/lib/home/queries";

beforeEach(() => {
  orCalls.length = 0;
  lteCalls.length = 0;
});

describe("getSoundsDueForHome", () => {
  it("excludes never-practiced (next_review is null) from the due query", async () => {
    await getSoundsDueForHome("user-1");

    // Due = scheduled and past due via lte — never opt-in next_review.is.null
    expect(lteCalls.some(([column]) => column === "next_review")).toBe(true);
    expect(orCalls.join(" ")).not.toContain("next_review.is.null");
  });
});
