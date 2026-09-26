// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCoachBankSet } from "../useCoachBankSet";
import * as contentBankQueries from "@/lib/content-bank/queries";
import * as coachSeen from "@/lib/ai-practice/coach-seen-items";
import type { AIMessage } from "@/lib/ai-practice/types";

vi.mock("@/lib/content-bank/queries", () => ({
  fetchBankItems: vi.fn().mockResolvedValue([]),
  cacheBankItems: vi.fn().mockResolvedValue(undefined),
  getCachedBankItems: vi.fn(),
  getCoachBankLevel: vi.fn().mockResolvedValue("A2"),
  revalidateCachedBankItems: vi.fn(),
}));

vi.mock("@/lib/ai-practice/coach-seen-items", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai-practice/coach-seen-items")>();
  return {
    ...actual,
    getRecentCoachStems: vi.fn().mockResolvedValue([]),
    saveCoachSeenItems: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock("@/lib/db", () => ({
  db: {
    learningState: {
      get: vi.fn().mockResolvedValue(null),
    },
  },
}));

describe("useCoachBankSet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const sample5Items = [
    {
      id: "1",
      kind: "coach_exercise" as const,
      tool_name: "render_multiple_choice" as const,
      level: "A2" as const,
      topic_id: "past_simple",
      payload: { question: "Q1", options: ["A", "B"], correctIndex: 0 },
      prompt_version: "v1",
      stem_hash: "h1",
      quality_flags: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      kind: "coach_exercise" as const,
      tool_name: "render_multiple_choice" as const,
      level: "A2" as const,
      topic_id: "past_simple",
      payload: { question: "Q2", options: ["A", "B"], correctIndex: 0 },
      prompt_version: "v1",
      stem_hash: "h2",
      quality_flags: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "3",
      kind: "coach_exercise" as const,
      tool_name: "render_fill_blank" as const,
      level: "A2" as const,
      topic_id: "past_simple",
      payload: { sentence: "S1", answer: "ate" },
      prompt_version: "v1",
      stem_hash: "h3",
      quality_flags: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "4",
      kind: "coach_exercise" as const,
      tool_name: "render_fill_blank" as const,
      level: "A2" as const,
      topic_id: "past_simple",
      payload: { sentence: "S2", answer: "went" },
      prompt_version: "v1",
      stem_hash: "h4",
      quality_flags: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: "5",
      kind: "coach_exercise" as const,
      tool_name: "render_speaking" as const,
      level: "A2" as const,
      topic_id: "past_simple",
      payload: { prompt: "Say P1", target: "P1" },
      prompt_version: "v1",
      stem_hash: "h5",
      quality_flags: 0,
      created_at: new Date().toISOString(),
    },
  ];

  it("serves 5 exercises as an AIMessage when 5 items are in the bank", async () => {
    vi.mocked(contentBankQueries.getCachedBankItems).mockResolvedValueOnce(sample5Items);
    vi.mocked(contentBankQueries.revalidateCachedBankItems).mockResolvedValueOnce({ ok: true, items: sample5Items });
    vi.mocked(coachSeen.getRecentCoachStems).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCoachBankSet());

    let message: Extract<AIMessage, { role: "model" }> | null = null;
    await act(async () => {
      message = await result.current.tryServeBankSet({ userId: "user-123" });
    });

    expect(message).not.toBeNull();
    const modelMessage = message as unknown as Extract<AIMessage, { role: "model" }>;
    expect(modelMessage.role).toBe("model");
    expect(modelMessage.toolCalls.size).toBe(5);
    for (const call of modelMessage.toolCalls.values()) {
      expect(call.status).toBe("pending");
      expect(call.id).toMatch(/^bank_/);
    }
    expect(coachSeen.saveCoachSeenItems).toHaveBeenCalledTimes(1);
  });

  it("returns null when bank has fewer than 5 items", async () => {
    const availableItems = sample5Items.slice(0, 3);
    vi.mocked(contentBankQueries.getCachedBankItems).mockResolvedValueOnce(availableItems);
    vi.mocked(contentBankQueries.revalidateCachedBankItems).mockResolvedValueOnce({ ok: true, items: availableItems });
    vi.mocked(coachSeen.getRecentCoachStems).mockResolvedValueOnce([]);

    const { result } = renderHook(() => useCoachBankSet());

    let message: Extract<AIMessage, { role: "model" }> | null = null;
    await act(async () => {
      message = await result.current.tryServeBankSet({ userId: "user-123" });
    });

    expect(message).toBeNull();
    expect(coachSeen.saveCoachSeenItems).not.toHaveBeenCalled();
  });
});
