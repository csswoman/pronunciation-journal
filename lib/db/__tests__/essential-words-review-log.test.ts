import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db, recordEssentialWordsReviewEvent } from "@/lib/db";

describe("srsRatingEvents — essential_words entityType", () => {
  beforeEach(async () => {
    await db.srsRatingEvents.clear();
  });

  it("recordEssentialWordsReviewEvent writes a row with entityType essential_words and the new fields", async () => {
    await recordEssentialWordsReviewEvent({
      userId: "user-1",
      wordId: "c1k:the",
      grade: 4,
      stability: 6,
      difficulty: 5,
      elapsedDays: 3,
      state: "review",
      hintsUsed: 0,
      latencyMs: 4200,
      isRepair: false,
    });

    const rows = await db.srsRatingEvents.where("userId").equals("user-1").toArray();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      userId: "user-1",
      entityType: "essential_words",
      entityId: "c1k:the",
      grade: 4,
      stability: 6,
      difficulty: 5,
      elapsedDays: 3,
      state: "review",
      hintsUsed: 0,
      latencyMs: 4200,
      isRepair: false,
      status: "pending",
    });
    expect(typeof rows[0].id).toBe("string");
    expect(typeof rows[0].occurredAt).toBe("string");
  });

  it("isRepair defaults to false when not specified", async () => {
    await recordEssentialWordsReviewEvent({
      userId: "user-1", wordId: "c1k:be", grade: 5,
      stability: 1, difficulty: 5, elapsedDays: 0, state: "new", hintsUsed: 0, latencyMs: 1000,
    });
    const rows = await db.srsRatingEvents.where("userId").equals("user-1").toArray();
    expect(rows[0].isRepair).toBe(false);
  });

  it("existing word_bank/topic_srs rows are unaffected by the new optional fields", async () => {
    await db.srsRatingEvents.add({
      id: "evt-1", userId: "user-1", entityType: "word_bank", entityId: "wb-1",
      grade: 4, occurredAt: new Date().toISOString(), status: "pending", createdAt: new Date().toISOString(),
    });
    const row = await db.srsRatingEvents.get("evt-1");
    expect(row?.stability).toBeUndefined();
    expect(row?.entityType).toBe("word_bank");
  });
});
