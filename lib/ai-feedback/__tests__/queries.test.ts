import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { fetchOwnFeedbackReports } from "../queries";

function makeClient(result: { data: unknown; error: { message: string } | null }) {
  const query = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  return {
    from: vi.fn().mockReturnValue(query),
  } as unknown as SupabaseClient<Database>;
}

describe("fetchOwnFeedbackReports", () => {
  it("returns the authenticated user's rows", async () => {
    const rows = [{ id: "report-1", feature: "coach_correction" }];
    const client = makeClient({ data: rows, error: null });

    await expect(fetchOwnFeedbackReports(client)).resolves.toEqual(rows);
  });

  it("surfaces query errors instead of treating them as an empty account", async () => {
    const client = makeClient({ data: null, error: { message: "JWT expired" } });

    await expect(fetchOwnFeedbackReports(client)).rejects.toThrow("JWT expired");
  });
});
