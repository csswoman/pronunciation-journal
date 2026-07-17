import { describe, expect, it, vi, beforeEach } from "vitest";
import { prepareCore1000SrsEntries } from "../prepare-srs";
import type { SRSData } from "@/lib/types";

const mockPut = vi.fn(async () => undefined);
const mockGetEntries = vi.fn(async (): Promise<SRSData[]> => []);

vi.mock("@/lib/db", () => ({
  db: {
    srsData: {
      put: (...args: unknown[]) => mockPut(...args),
    },
  },
  getCore1000SrsEntries: () => mockGetEntries(),
}));

function snoozedEntry(wordId: string, nextReview: string): SRSData {
  return {
    wordId,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    nextReview,
    status: "snoozed",
    snoozedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("prepareCore1000SrsEntries", () => {
  beforeEach(() => {
    mockPut.mockClear();
    mockGetEntries.mockReset();
    mockGetEntries.mockResolvedValue([]);
  });

  it("returns entries unchanged when no snoozes expired", async () => {
    const entries = [snoozedEntry("c1k:apple", "2099-01-01T00:00:00.000Z")];
    mockGetEntries.mockResolvedValue(entries);

    const result = await prepareCore1000SrsEntries(new Date("2026-07-17T12:00:00.000Z"));

    expect(result.entries).toEqual(entries);
    expect(result.activatedWordIds).toEqual([]);
    expect(mockPut).not.toHaveBeenCalled();
  });

  it("activates expired snoozes, persists changed rows, and tracks word ids", async () => {
    const now = new Date("2026-07-17T12:00:00.000Z");
    const expired = snoozedEntry("c1k:apple", "2026-07-01T00:00:00.000Z");
    mockGetEntries.mockResolvedValue([expired]);

    const result = await prepareCore1000SrsEntries(now);

    expect(result.entries[0].status).toBe("active");
    expect(result.entries[0].nextReview).toBe(now.toISOString());
    expect(result.activatedWordIds).toEqual(["c1k:apple"]);
    expect(mockPut).toHaveBeenCalledOnce();
    expect(mockPut).toHaveBeenCalledWith(result.entries[0]);
  });
});
