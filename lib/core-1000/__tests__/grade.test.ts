import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(async () => undefined),
  saveAttempt: vi.fn(async () => undefined),
  updateDailyProgress: vi.fn(async () => undefined),
  updateUserStats: vi.fn(async () => undefined),
}));
vi.mock("@/lib/db", () => dbMocks);

import { gradeCore1000Word } from "../grade";
import type { SRSData } from "@/lib/types";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSRSData.mockResolvedValue(undefined);
});

describe("gradeCore1000Word", () => {
  it("creates the SRS entry on first grade and namespaces the id", async () => {
    await gradeCore1000Word("To", 4);
    expect(dbMocks.getSRSData).toHaveBeenCalledWith("c1k:to");
    expect(dbMocks.saveSRSData).toHaveBeenCalledWith(
      expect.objectContaining({ wordId: "c1k:to", repetitions: 1 })
    );
  });

  it("updates an existing entry instead of resetting it", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "c1k:to", word: "to", ease: 2.5, interval: 1,
      repetitions: 2, nextReview: "2026-06-10T00:00:00Z",
    } satisfies SRSData);
    await gradeCore1000Word("to", 5);
    expect(dbMocks.saveSRSData).toHaveBeenCalledWith(
      expect.objectContaining({ repetitions: 3 })
    );
  });

  it("persists attempt + daily progress + stats when accuracy is provided (speak path)", async () => {
    await gradeCore1000Word("to", 4, { accuracy: 85, transcript: "i want to go home" });
    expect(dbMocks.saveAttempt).toHaveBeenCalledOnce();
    expect(dbMocks.updateDailyProgress).toHaveBeenCalledOnce();
    expect(dbMocks.updateUserStats).toHaveBeenCalledOnce();
  });

  it("only touches SRS on self-grade (no accuracy)", async () => {
    await gradeCore1000Word("to", 3);
    expect(dbMocks.saveAttempt).not.toHaveBeenCalled();
    expect(dbMocks.updateDailyProgress).not.toHaveBeenCalled();
    expect(dbMocks.updateUserStats).not.toHaveBeenCalled();
    expect(dbMocks.saveSRSData).toHaveBeenCalledOnce();
  });
});
