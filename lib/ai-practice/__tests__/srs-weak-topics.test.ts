import { describe, expect, it } from "vitest";
import type { SRSRatingEventRecord } from "@/lib/db";
import { aggregateTopicRatings, mergeWeakTopics } from "../srs-weak-topics";

const NOW = new Date("2026-09-08T00:00:00.000Z").getTime();

function daysAgo(n: number): string {
  return new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();
}

function rating(
  topic: string,
  grade: number,
  occurredAt: string = daysAgo(1),
): SRSRatingEventRecord {
  return {
    id: `${topic}-${grade}-${occurredAt}-${Math.random()}`,
    userId: "user-a",
    entityType: "topic_srs",
    topic,
    grade,
    occurredAt,
    status: "applied",
    createdAt: occurredAt,
  };
}

describe("aggregateTopicRatings", () => {
  it("surfaces a topic failed more often than the weak threshold", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:present perfect", 1),
        rating("grammar:present perfect", 1),
        rating("grammar:present perfect", 4),
      ],
      NOW,
    );

    expect(weak).toHaveLength(1);
    expect(weak[0]).toMatchObject({
      topic: "Presente perfecto",
      sampleCount: 3,
    });
    expect(weak[0].errorRate).toBeCloseTo(2 / 3);
  });

  it("ignores a topic the learner mostly gets right", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:articles", 5),
        rating("grammar:articles", 4),
        rating("grammar:articles", 1),
      ],
      NOW,
    );

    expect(weak).toEqual([]);
  });

  it("ignores a topic with too few ratings to be signal", () => {
    const weak = aggregateTopicRatings(
      [rating("grammar:passive", 1), rating("grammar:passive", 1)],
      NOW,
    );

    expect(weak).toEqual([]);
  });

  it("ignores ratings older than the window", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:passive", 1, daysAgo(60)),
        rating("grammar:passive", 1, daysAgo(45)),
        rating("grammar:passive", 1, daysAgo(31)),
      ],
      NOW,
    );

    expect(weak).toEqual([]);
  });

  it("skips the catch-all vocabulary bucket", () => {
    const weak = aggregateTopicRatings(
      [
        rating("vocab:vocabulary", 1),
        rating("vocab:vocabulary", 1),
        rating("vocab:vocabulary", 1),
      ],
      NOW,
    );

    expect(weak).toEqual([]);
  });

  it("ignores events from other SRS entities", () => {
    const wordEvent: SRSRatingEventRecord = {
      id: "w1",
      userId: "user-a",
      entityType: "word_bank",
      entityId: "word-1",
      grade: 1,
      occurredAt: daysAgo(1),
      status: "applied",
      createdAt: daysAgo(1),
    };

    expect(aggregateTopicRatings([wordEvent, wordEvent, wordEvent], NOW)).toEqual([]);
  });

  it("orders the weakest topic first", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:passive", 1),
        rating("grammar:passive", 1),
        rating("grammar:passive", 1),
        rating("grammar:conditionals", 1),
        rating("grammar:conditionals", 1),
        rating("grammar:conditionals", 5),
      ],
      NOW,
    );

    expect(weak.map((t) => t.topic)).toEqual(["Voz pasiva", "Condicionales"]);
  });

  it("reports the most recent rating as lastCoveredAt", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:passive", 1, daysAgo(10)),
        rating("grammar:passive", 1, daysAgo(2)),
        rating("grammar:passive", 1, daysAgo(6)),
      ],
      NOW,
    );

    expect(weak[0].lastCoveredAt).toBe(daysAgo(2));
  });

  it("tolerates an unparseable timestamp instead of throwing", () => {
    const weak = aggregateTopicRatings(
      [
        rating("grammar:passive", 1, "not-a-date"),
        rating("grammar:passive", 1),
        rating("grammar:passive", 1),
        rating("grammar:passive", 1),
      ],
      NOW,
    );

    expect(weak[0].sampleCount).toBe(3);
  });
});

describe("mergeWeakTopics", () => {
  const coachTopic = {
    topic: "Presente perfecto",
    errorRate: 0.5,
    sampleCount: 8,
    lastCoveredAt: daysAgo(1),
  };

  it("keeps the coach's own row when both sources know the topic", () => {
    const merged = mergeWeakTopics(
      [coachTopic],
      [{ topic: "Presente perfecto", errorRate: 0.9, sampleCount: 3, lastCoveredAt: daysAgo(2) }],
    );

    expect(merged).toEqual([coachTopic]);
  });

  it("adds topics the coach has never seen", () => {
    const fromSrs = {
      topic: "Voz pasiva",
      errorRate: 0.8,
      sampleCount: 5,
      lastCoveredAt: daysAgo(1),
    };

    expect(mergeWeakTopics([coachTopic], [fromSrs])).toEqual([coachTopic, fromSrs]);
  });

  it("matches case-insensitively so a label variant is not duplicated", () => {
    const merged = mergeWeakTopics(
      [coachTopic],
      [{ topic: "presente perfecto", errorRate: 0.9, sampleCount: 3, lastCoveredAt: daysAgo(2) }],
    );

    expect(merged).toHaveLength(1);
  });
});
