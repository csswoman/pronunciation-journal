import { describe, expect, it, vi, beforeEach } from "vitest";
import { generateReorderAI } from "../reorder-ai";

vi.mock("@/lib/auth/session", () => ({
  getAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe("generateReorderAI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls /api/gemini/generate-sentences and generates exercises", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        fragments: [
          {
            id: "frag-1",
            content: "She is learning English every morning.",
            source: "ai",
          },
        ],
      }),
    });

    const exercises = await generateReorderAI("daily routines", "A2", 1);
    expect(mockFetch).toHaveBeenCalledWith("/api/gemini/generate-sentences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-access-token",
      },
      body: JSON.stringify({
        topic: "daily routines",
        level: "A2",
        count: 1,
        deckSlug: undefined,
      }),
    });

    expect(exercises).toHaveLength(1);
    expect(exercises[0].topic).toBe("daily routines");
    expect(exercises[0].sentence).toBe("She is learning English every morning.");
  });

  it("throws when sentence generation API fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
    });

    await expect(generateReorderAI("grammar", "B1")).rejects.toThrow("Sentence generation failed: 502");
  });
});
