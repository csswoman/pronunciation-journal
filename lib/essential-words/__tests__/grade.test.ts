import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db", () => dbMocks);

import { gradeEssentialWord } from "../grade";
import type { SRSData } from "@/lib/types";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSRSData.mockResolvedValue(undefined);
});

const USER_ID = "user-1";

describe("gradeEssentialWord", () => {
  it("creates the SRS entry on first grade and namespaces the id", async () => {
    await gradeEssentialWord("To", 4, {}, USER_ID);
    expect(dbMocks.getSRSData).toHaveBeenCalledWith("c1k:to", USER_ID);
    expect(dbMocks.saveSRSData).toHaveBeenCalledWith(
      expect.objectContaining({ wordId: "c1k:to", repetitions: 1 }),
      USER_ID,
    );
  });

  it("updates an existing entry instead of resetting it", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "c1k:to", word: "to", ease: 2.5, interval: 1,
      repetitions: 2, nextReview: "2026-06-10T00:00:00Z",
    } satisfies SRSData);
    await gradeEssentialWord("to", 5, {}, USER_ID);
    expect(dbMocks.saveSRSData).toHaveBeenCalledWith(
      expect.objectContaining({ repetitions: 3 }),
      USER_ID,
    );
  });

  it("persists attempt + daily progress + stats when accuracy is provided (speak path)", async () => {
    await gradeEssentialWord("to", 4, { accuracy: 85, transcript: "i want to go home" }, USER_ID);
    expect(dbMocks.saveAttempt).toHaveBeenCalledOnce();
    expect(dbMocks.updateDailyProgress).toHaveBeenCalledOnce();
    expect(dbMocks.updateUserStats).toHaveBeenCalledOnce();
  });

  it("only touches SRS on self-grade (no accuracy)", async () => {
    await gradeEssentialWord("to", 3, {}, USER_ID);
    expect(dbMocks.saveAttempt).not.toHaveBeenCalled();
    expect(dbMocks.updateDailyProgress).not.toHaveBeenCalled();
    expect(dbMocks.updateUserStats).not.toHaveBeenCalled();
    expect(dbMocks.saveSRSData).toHaveBeenCalledOnce();
  });

  it("no-ops when userId is missing", async () => {
    await gradeEssentialWord("to", 4);
    expect(dbMocks.getSRSData).not.toHaveBeenCalled();
    expect(dbMocks.saveSRSData).not.toHaveBeenCalled();
  });

  it("migrates a legacy SM-2 entry to FSRS fields on first FSRS-routed grade", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "c1k:to", word: "to", ease: 2.5, interval: 10,
      repetitions: 2, nextReview: "2026-08-10T00:00:00Z", lastReview: "2026-08-01T00:00:00Z",
    } satisfies SRSData);

    await gradeEssentialWord("to", 4, {}, USER_ID);

    const saved = (dbMocks.saveSRSData.mock.calls as unknown[][])[0][0] as SRSData;
    expect(saved.stability).toBeGreaterThan(0);
    expect(saved.difficulty).toBeGreaterThanOrEqual(1);
    expect(saved.difficulty).toBeLessThanOrEqual(10);
    expect(saved.state).toBeDefined();
  });

  it("increments fsrsRealReviews from 0 on the first migrated FSRS review", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "c1k:to", word: "to", ease: 2.5, interval: 10,
      repetitions: 2, nextReview: "2026-08-10T00:00:00Z", lastReview: "2026-08-01T00:00:00Z",
      stability: 10, difficulty: 3, state: "Review", fsrsRealReviews: 0,
    } satisfies SRSData);

    await gradeEssentialWord("to", 4, {}, USER_ID);

    const saved = (dbMocks.saveSRSData.mock.calls as unknown[][])[0][0] as SRSData;
    expect(saved.fsrsRealReviews).toBe(1);
  });

  it("advances nextReview into the future via the FSRS scheduler", async () => {
    await gradeEssentialWord("to", 4, {}, USER_ID);
    const saved = (dbMocks.saveSRSData.mock.calls as unknown[][])[0][0] as SRSData;
    expect(new Date(saved.nextReview).getTime()).toBeGreaterThan(Date.now());
  });

  it("keeps attempt, daily progress, and stats side effects on the speak path", async () => {
    await gradeEssentialWord("to", 4, { accuracy: 90, transcript: "to the store" }, USER_ID);
    expect(dbMocks.saveAttempt).toHaveBeenCalledOnce();
    expect(dbMocks.updateDailyProgress).toHaveBeenCalledOnce();
    expect(dbMocks.updateUserStats).toHaveBeenCalledOnce();
  });
});
