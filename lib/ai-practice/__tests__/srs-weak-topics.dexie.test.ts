// @vitest-environment jsdom
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { beforeEach, describe, expect, it } from "vitest";
import { db, type SRSRatingEventRecord } from "@/lib/db";
import { aggregateTopicRatings } from "../srs-weak-topics";

/**
 * The compound-index range query in `load-state.ts` is mocked in the unit
 * tests, so this exercises it against real Dexie: an index name typo or a
 * wrong key range would return nothing and silently disable the bridge.
 */

function event(
  id: string,
  topic: string | undefined,
  entityType: SRSRatingEventRecord["entityType"],
  grade: number,
): SRSRatingEventRecord {
  const occurredAt = new Date().toISOString();
  return {
    id,
    userId: "user-a",
    entityType,
    topic,
    entityId: entityType === "word_bank" ? "word-1" : undefined,
    grade,
    occurredAt,
    status: "applied",
    createdAt: occurredAt,
  };
}

async function readTopicRatings(userId: string) {
  return db.srsRatingEvents
    .where("[userId+entityType+topic]")
    .between([userId, "topic_srs", Dexie.minKey], [userId, "topic_srs", Dexie.maxKey])
    .toArray();
}

describe("topic rating range query", { timeout: 15_000 }, () => {
  beforeEach(async () => {
    await db.open();
    await db.srsRatingEvents.clear();
  });

  it("returns this user's topic ratings and nothing else", async () => {
    await db.srsRatingEvents.bulkAdd([
      event("a", "grammar:passive", "topic_srs", 1),
      event("b", "grammar:passive", "topic_srs", 1),
      event("c", "grammar:passive", "topic_srs", 4),
      // Different entity type — must not be picked up by the range.
      event("d", undefined, "word_bank", 1),
      // Different user — must not leak across accounts.
      { ...event("e", "grammar:passive", "topic_srs", 1), userId: "user-b" },
    ]);

    const rows = await readTopicRatings("user-a");

    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.entityType === "topic_srs")).toBe(true);
    expect(rows.every((r) => r.userId === "user-a")).toBe(true);
  });

  it("feeds the aggregator so a failed topic surfaces end to end", async () => {
    await db.srsRatingEvents.bulkAdd([
      event("a", "grammar:present perfect", "topic_srs", 1),
      event("b", "grammar:present perfect", "topic_srs", 1),
      event("c", "grammar:present perfect", "topic_srs", 4),
    ]);

    const weak = aggregateTopicRatings(await readTopicRatings("user-a"));

    expect(weak.map((t) => t.topic)).toEqual(["Presente perfecto"]);
  });

  it("returns an empty list when the user has no topic ratings", async () => {
    expect(await readTopicRatings("user-a")).toEqual([]);
  });
});
