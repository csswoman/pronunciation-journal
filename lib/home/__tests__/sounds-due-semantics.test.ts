import { describe, it, expect, vi, beforeEach } from "vitest";

const orMock = vi.fn().mockReturnThis();
const supabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: orMock,
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  in: vi.fn().mockResolvedValue({ data: [], error: null }),
};

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => supabase),
}));

beforeEach(() => {
  orMock.mockClear();
});

describe("getSoundsDueForHome", () => {
  it("excludes never-practiced (next_review is null) from the due query", async () => {
    const { getSoundsDueForHome } = await import("@/lib/home/queries");
    await getSoundsDueForHome("user-1");
    // No filter clause may opt-in next_review.is.null
    const orCalls = orMock.mock.calls.flat().join(" ");
    expect(orCalls).not.toContain("next_review.is.null");
  });
});
