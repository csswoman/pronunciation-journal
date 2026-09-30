import { describe, it, expect } from "vitest";
import { computeCheckpointReadiness, lastCompletedCheckpointAt } from "@/lib/home/checkpoint-readiness";
import { LEVEL_ASSESSMENT_CONTRACTS } from "@/lib/courses/curriculum";

const a1Slugs = LEVEL_ASSESSMENT_CONTRACTS.a1.requiredLessonSlugs;
const NOW = new Date("2026-09-21T00:00:00.000Z").getTime();

describe("computeCheckpointReadiness", () => {
  it("ignores an oral-pending result when finding the last completed checkpoint", () => {
    const recent = new Date(NOW - 60_000).toISOString();
    const older = new Date(NOW - 24 * 60 * 60 * 1000).toISOString();
    expect(lastCompletedCheckpointAt([
      { completed_at: recent, topic_scores: { oralEvidence: { status: "pending" } } },
      { completed_at: older, topic_scores: { oralEvidence: { status: "passed" } } },
    ])).toBe(older);
    expect(lastCompletedCheckpointAt([
      { completed_at: recent, topic_scores: { oralEvidence: { status: "pending" } } },
    ])).toBeNull();
  });

  it("is ready when all lessons are done, half have evidence, and no recent attempt", () => {
    const readiness = computeCheckpointReadiness({
      level: "a1",
      completedLessonSlugs: new Set(a1Slugs),
      evidencedDeckSlugs: new Set(a1Slugs.slice(0, Math.ceil(a1Slugs.length / 2))),
      lastCheckpointAt: null,
      now: NOW,
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.reason).toBe("ready");
    expect(readiness.missingSlugs).toEqual([]);
    expect(readiness.completedRequired).toBe(a1Slugs.length);
  });

  it("reports lessons_missing when required lessons are incomplete", () => {
    const readiness = computeCheckpointReadiness({
      level: "a1",
      completedLessonSlugs: new Set(a1Slugs.slice(0, 2)),
      evidencedDeckSlugs: new Set(a1Slugs),
      lastCheckpointAt: null,
      now: NOW,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toBe("lessons_missing");
    expect(readiness.missingSlugs).toEqual(a1Slugs.slice(2));
  });

  it("reports no_evidence when lessons are done but fewer than half have SRS evidence", () => {
    const readiness = computeCheckpointReadiness({
      level: "a1",
      completedLessonSlugs: new Set(a1Slugs),
      evidencedDeckSlugs: new Set(a1Slugs.slice(0, 1)),
      lastCheckpointAt: null,
      now: NOW,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toBe("no_evidence");
  });

  it("reports recent_attempt when a checkpoint was taken within the last 3 days", () => {
    const twoDaysAgo = new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString();
    const readiness = computeCheckpointReadiness({
      level: "a1",
      completedLessonSlugs: new Set(a1Slugs),
      evidencedDeckSlugs: new Set(a1Slugs),
      lastCheckpointAt: twoDaysAgo,
      now: NOW,
    });

    expect(readiness.ready).toBe(false);
    expect(readiness.reason).toBe("recent_attempt");
  });

  it("is ready again once the last checkpoint attempt is older than 3 days", () => {
    const fourDaysAgo = new Date(NOW - 4 * 24 * 60 * 60 * 1000).toISOString();
    const readiness = computeCheckpointReadiness({
      level: "a1",
      completedLessonSlugs: new Set(a1Slugs),
      evidencedDeckSlugs: new Set(a1Slugs),
      lastCheckpointAt: fourDaysAgo,
      now: NOW,
    });

    expect(readiness.ready).toBe(true);
    expect(readiness.reason).toBe("ready");
  });
});
