// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

const persistMock = vi.fn();

vi.mock("@/lib/courses/assessment-profile", () => ({
  persistAssessmentConceptProfile: (...args: unknown[]) => persistMock(...args),
}));

import { claimGuestPlacement } from "../guest-assessment";

const result = {
  assignedLevel: "A2",
  passed: true,
  passedLevels: ["a1"],
  score: 1,
  total: 1,
  topicScores: [{ lessonSlug: "a1-present", title: "Present", correct: 1, total: 1 }],
  strengths: [{ lessonSlug: "a1-present", title: "Present" }],
  needsReview: [],
  conceptSignals: [{
    lessonSlug: "a1-present",
    level: "a1",
    title: "Present",
    selfRating: "confident",
    status: "mastered",
    correct: 1,
    total: 1,
    assessedAt: "2026-07-18T12:00:00.000Z",
  }],
  completedAt: "2026-07-18T12:01:00.000Z",
};

describe("claimGuestPlacement", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        clear: () => store.clear(),
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
    persistMock.mockReset().mockResolvedValue(undefined);
  });

  it("validates, persists, and moves the guest result after login", async () => {
    window.localStorage.setItem("assessment:guest:placement:placement", JSON.stringify(result));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    await expect(claimGuestPlacement("u1")).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith("/api/assessment/results", expect.objectContaining({ method: "POST" }));
    expect(persistMock).toHaveBeenCalledWith("u1", result.conceptSignals, "A2");
    expect(window.localStorage.getItem("assessment:guest:placement:placement")).toBeNull();
    expect(window.localStorage.getItem("assessment:u1:placement:placement")).toContain('"assignedLevel":"A2"');
  });

  it("keeps invalid guest data local and never sends it", async () => {
    window.localStorage.setItem("assessment:guest:placement:placement", JSON.stringify({ assignedLevel: "C9" }));
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(claimGuestPlacement("u2")).resolves.toBe(false);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem("assessment:guest:placement:placement")).not.toBeNull();
  });
});
