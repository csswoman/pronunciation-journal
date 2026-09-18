import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    from: () => ({
      select: function (this: unknown) {
        return this;
      },
    }),
  }),
}));

import { sumPracticeMs } from "../queries";

describe("sumPracticeMs", () => {
  it("contributes 0 when time_ms is null, not a fabricated fallback", () => {
    const nowIso = "2026-09-18T12:00:00.000Z";
    const rows = [{ answered_at: "2026-09-18T10:00:00.000Z", time_ms: null }];

    const { todayMs, weekMs } = sumPracticeMs(rows, nowIso);

    expect(todayMs).toBe(0);
    expect(weekMs).toBe(0);
  });

  it("counts a row's time_ms into todayMs and weekMs when answered today", () => {
    const nowIso = "2026-09-18T12:00:00.000Z";
    const rows = [{ answered_at: "2026-09-18T10:00:00.000Z", time_ms: 120_000 }];

    const { todayMs, weekMs } = sumPracticeMs(rows, nowIso);

    expect(todayMs).toBe(120_000);
    expect(weekMs).toBe(120_000);
  });

  it("counts a row's time_ms into weekMs but not todayMs when answered earlier in the week", () => {
    // 2026-09-18 is a Friday, so the local week starts Monday 2026-09-14.
    const nowIso = "2026-09-18T12:00:00.000Z";
    const rows = [{ answered_at: "2026-09-15T10:00:00.000Z", time_ms: 120_000 }];

    const { todayMs, weekMs } = sumPracticeMs(rows, nowIso);

    expect(todayMs).toBe(0);
    expect(weekMs).toBe(120_000);
  });

  it("excludes a row answered before the current local week", () => {
    const nowIso = "2026-09-18T12:00:00.000Z";
    const rows = [{ answered_at: "2026-09-07T10:00:00.000Z", time_ms: 120_000 }];

    const { todayMs, weekMs } = sumPracticeMs(rows, nowIso);

    expect(todayMs).toBe(0);
    expect(weekMs).toBe(0);
  });
});
