import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(async (data: SRSData) => {
    void data;
  }),
}));
vi.mock("@/lib/db", () => dbMocks);

import { upsertFragmentSrs, fragmentSrsId } from "../fragment-srs";
import type { SRSData } from "@/lib/types";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSRSData.mockResolvedValue(undefined);
});

describe("fragmentSrsId", () => {
  it("namespaces the fragment id under the fragment: prefix", () => {
    expect(fragmentSrsId("abc-123")).toBe("fragment:abc-123");
  });
});

describe("upsertFragmentSrs", () => {
  it("creates a new SRS entry on first grade with a future nextReview", async () => {
    await upsertFragmentSrs("abc-123", 5);

    expect(dbMocks.getSRSData).toHaveBeenCalledWith("fragment:abc-123");
    expect(dbMocks.saveSRSData).toHaveBeenCalledTimes(1);
    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("fragment:abc-123");
    expect(saved.repetitions).toBe(1);
    expect(new Date(saved.nextReview).getTime()).toBeGreaterThan(Date.now());
  });

  it("updates the existing entry instead of resetting it", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "fragment:abc-123",
      word: "fragment:abc-123",
      ease: 2.5,
      interval: 1,
      repetitions: 2,
      nextReview: "2026-06-10T00:00:00.000Z",
    } satisfies SRSData);

    await upsertFragmentSrs("abc-123", 5);

    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("fragment:abc-123");
    expect(saved.repetitions).toBe(3);
  });

  it("schedules a lapse (failed grade) without throwing", async () => {
    await upsertFragmentSrs("abc-123", 1);
    expect(dbMocks.saveSRSData).toHaveBeenCalledTimes(1);
  });
});
