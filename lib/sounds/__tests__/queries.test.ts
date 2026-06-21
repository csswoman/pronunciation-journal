import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    from: fromMock,
  }),
}));

import { getUserContrastProgress } from "@/lib/sounds/queries";

describe("sound query projections", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("selects only contrast progress fields consumed by mastery ranking and hooks", async () => {
    const orderMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "progress-1",
          user_id: "user-1",
          contrast_id: "/ɪ/|/iː/",
          ease_factor: 2.5,
          interval_days: 2,
          next_review: null,
          last_seen: null,
          total_attempts: 4,
          correct_answers: 3,
          streak: 1,
          mastery_pct: 72,
        },
      ],
      error: null,
    });
    const eqMock = vi.fn(() => ({ order: orderMock }));
    const selectMock = vi.fn(() => ({ eq: eqMock }));
    fromMock.mockReturnValue({ select: selectMock });

    const rows = await getUserContrastProgress("user-1");

    expect(rows).toHaveLength(1);
    expect(selectMock).toHaveBeenCalledWith(
      "id,user_id,contrast_id,ease_factor,interval_days,next_review,last_seen,total_attempts,correct_answers,streak,mastery_pct"
    );
  });
});
