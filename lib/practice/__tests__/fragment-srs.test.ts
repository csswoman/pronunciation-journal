import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMocks = vi.hoisted(() => ({
  getSRSData: vi.fn(),
  saveSRSData: vi.fn(async (data: SRSData) => {
    void data;
  }),
  transaction: vi.fn(async (_mode: string, _tables: unknown[], work: () => Promise<void>) => work()),
}));
const syncMocks = vi.hoisted(() => ({ enqueue: vi.fn() }));
vi.mock("@/lib/db", () => ({ ...dbMocks, db: { srsData: {}, syncOutbox: {}, transaction: dbMocks.transaction } }));
vi.mock("@/lib/sync/sync-manager", () => syncMocks);

import { upsertFragmentSrs, fragmentSrsId } from "../fragment-srs";
import type { SRSData } from "@/lib/types";

beforeEach(() => {
  vi.clearAllMocks();
  dbMocks.getSRSData.mockResolvedValue(undefined);
  syncMocks.enqueue.mockResolvedValue(1);
});

describe("fragmentSrsId", () => {
  it("namespaces the fragment id under the fragment: prefix", () => {
    expect(fragmentSrsId("abc-123")).toBe("fragment:abc-123");
  });
});

describe("upsertFragmentSrs", () => {
  it("creates a new SRS entry on first grade with a future nextReview", async () => {
    await upsertFragmentSrs("user-1", "abc-123", 5);

    expect(dbMocks.getSRSData).toHaveBeenCalledWith("fragment:abc-123", "user-1");
    expect(dbMocks.saveSRSData).toHaveBeenCalledTimes(1);
    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("fragment:abc-123");
    expect(saved.repetitions).toBe(1);
    expect(new Date(saved.nextReview).getTime()).toBeGreaterThan(Date.now());
    expect(syncMocks.enqueue).toHaveBeenCalledWith(
      "user-1",
      "content_srs",
      "upsert",
      expect.objectContaining({ content_id: "abc-123", namespace: "text_fragments", user_id: "user-1" }),
      undefined,
      "user_id,namespace,content_id",
    );
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

    await upsertFragmentSrs("user-1", "abc-123", 5);

    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("fragment:abc-123");
    expect(saved.repetitions).toBe(3);
  });

  it("schedules a lapse (failed grade) without throwing", async () => {
    await upsertFragmentSrs("user-1", "abc-123", 1);
    expect(dbMocks.saveSRSData).toHaveBeenCalledTimes(1);
  });

  it("migrates a legacy SM-2 entry to FSRS fields on first FSRS-routed grade", async () => {
    dbMocks.getSRSData.mockResolvedValue({
      wordId: "fragment:abc-123", word: "fragment:abc-123", ease: 2.5, interval: 5,
      repetitions: 1, nextReview: "2026-08-09T00:00:00.000Z", lastReview: "2026-08-01T00:00:00.000Z",
    } satisfies SRSData);

    await upsertFragmentSrs("user-1", "abc-123", 5);

    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.stability).toBeGreaterThan(0);
    expect(saved.difficulty).toBeGreaterThanOrEqual(1);
    expect(saved.state).toBeDefined();
    expect(saved.fsrsRealReviews).toBe(1);
  });

  it("uses the shared FSRS scheduler shape for a normal upsert", async () => {
    await upsertFragmentSrs("user-1", "abc-123", 4);

    const saved = dbMocks.saveSRSData.mock.calls[0][0] as SRSData;
    expect(saved.wordId).toBe("fragment:abc-123");
    expect(typeof saved.stability).toBe("number");
    expect(typeof saved.difficulty).toBe("number");
  });
});
