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
  evaluatedLevels: ["a1"],
  score: 1,
  total: 1,
  listeningScore: 1,
  listeningTotal: 6,
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
  answers: { "a1:reading:1": 0 },
  selfRatings: { "a1-present": "confident" },
  checkpointLevel: "a2",
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

    expect(fetchMock).toHaveBeenCalledWith("/api/assessment/results", expect.objectContaining({
      method: "POST",
      body: expect.stringContaining('"answers":{"a1:reading:1":0}'),
    }));
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

  it("keeps the guest key and does not repeat the POST when the Dexie write fails", async () => {
    window.localStorage.setItem("assessment:guest:placement:placement", JSON.stringify(result));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    persistMock.mockRejectedValueOnce(new Error("dexie down"));

    await expect(claimGuestPlacement("u3")).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("assessment:guest:placement:placement")).not.toBeNull();
    expect(window.localStorage.getItem("assessment:guest:placement:posted:u3")).toBe(result.completedAt);

    persistMock.mockResolvedValueOnce(undefined);
    await expect(claimGuestPlacement("u3")).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("assessment:guest:placement:placement")).toBeNull();
  });

  it("does not let a failed local claim for one account suppress another account's server claim", async () => {
    window.localStorage.setItem("assessment:guest:placement:placement", JSON.stringify(result));
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    persistMock.mockRejectedValueOnce(new Error("dexie down"));

    await expect(claimGuestPlacement("u3")).resolves.toBe(false);
    await expect(claimGuestPlacement("u4")).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(persistMock).toHaveBeenLastCalledWith("u4", result.conceptSignals, "A2");
  });

  it("keeps the guest key when the POST returns a server error", async () => {
    window.localStorage.setItem("assessment:guest:placement:placement", JSON.stringify(result));
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal("fetch", fetchMock);

    await expect(claimGuestPlacement("u4")).resolves.toBe(false);

    expect(window.localStorage.getItem("assessment:guest:placement:placement")).not.toBeNull();
    expect(window.localStorage.getItem("assessment:guest:placement:posted:u4")).toBeNull();
  });
});
