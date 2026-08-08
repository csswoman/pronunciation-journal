// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db, type LearningItemRecord } from "@/lib/db";
import type {
  AttemptAssessment,
  AttemptLog,
  ItemSchedule,
  LearningItem,
  SrsReviewEvent,
} from "../verification/types";
import {
  fromAttemptLogRow,
  fromLearningItemRow,
  fromSrsReviewEventRow,
  getAttemptLogs,
  getDueLearningItems,
  getLearningItems,
  getSrsReviewEvents,
  putLearningItemsTx,
  saveAttemptBundle,
  toAttemptLogRecord,
  toAttemptLogRow,
  toLearningItemRecord,
  toLearningItemRow,
  toSrsReviewEventRecord,
  toSrsReviewEventRow,
  validateAttemptBundle,
} from "../queries";

const USER = "00000000-0000-4000-8000-000000000001";
const OTHER = "00000000-0000-4000-8000-000000000002";
const AT = "2026-08-06T10:00:00.000Z";
const DUE = "2026-08-07T10:00:00.000Z";

const assessment: AttemptAssessment = {
  grade: "Good",
  modality: "production",
  correct: true,
  latencyMs: 2_000,
  interactionDurationMs: 5_000,
  usedHints: false,
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
};

const schedule: ItemSchedule = {
  kind: "fsrs", dueAt: DUE, stability: 4, difficulty: 5, state: "Review",
};

function item(id: string, skill: "meaning" | "production", itemSchedule = schedule): LearningItem {
  return {
    id,
    wordId: "c1k:on",
    skill,
    contentOrigin: "authored",
    schedule: itemSchedule,
    repetitions: 1,
    lapses: 0,
    suspended: false,
  };
}

const attempt: AttemptLog = {
  id: "attempt-1",
  sessionId: "session-1",
  wordId: "c1k:on",
  assessment,
  observations: [],
  eventType: "scheduled-review",
  occurredAt: AT,
};

function event(id: string, learningItemId: string): SrsReviewEvent {
  return {
    id,
    attemptLogId: attempt.id,
    learningItemId,
    grade: "Good",
    assessment,
    priorSchedule: { kind: "none" },
    resultingSchedule: schedule,
    occurredAt: AT,
    affectsSchedule: true,
    fsrsAudit: { schedulerVersion: "1", desiredRetention: 0.9 },
  };
}

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

afterEach(() => db.close());

describe("mappers del modelo de habilidades", () => {
  it("deriva los espejos desde schedule y elimina un dueAt viejo para none", () => {
    const scheduled = toLearningItemRecord(item("item-1", "meaning"), USER, AT);
    expect(scheduled).toMatchObject({ scheduleKind: "fsrs", dueAt: DUE });

    const none = toLearningItemRecord(
      { ...item("item-1", "meaning"), schedule: { kind: "none" } }, USER, AT,
    );
    expect(none.scheduleKind).toBe("none");
    expect(none).not.toHaveProperty("dueAt");
  });

  it("hace round-trip camelCase ↔ snake_case sin atribuir el intento a un ítem", () => {
    const itemRecord = toLearningItemRecord(item("item-1", "meaning"), USER, AT);
    expect(fromLearningItemRow(toLearningItemRow(itemRecord))).toEqual(item("item-1", "meaning"));

    const attemptRecord = toAttemptLogRecord(attempt, USER);
    expect(attemptRecord).not.toHaveProperty("learningItemId");
    expect(fromAttemptLogRow(toAttemptLogRow(attemptRecord))).toEqual(attempt);

    const first = toSrsReviewEventRecord(event("event-1", "item-1"), USER);
    const second = toSrsReviewEventRecord(event("event-2", "item-2"), USER);
    expect(fromSrsReviewEventRow(toSrsReviewEventRow(first))).toEqual(event("event-1", "item-1"));
    expect(fromSrsReviewEventRow(toSrsReviewEventRow(second)).learningItemId).toBe("item-2");
  });

  it("prefiere schedule canónico y reporta espejos remotos inconsistentes", () => {
    const report = vi.fn();
    const row = {
      ...toLearningItemRow(toLearningItemRecord(item("item-1", "meaning"), USER, AT)),
      schedule_kind: "none" as const,
      due_at: null,
    };

    expect(fromLearningItemRow(row, report).schedule).toEqual(schedule);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ itemId: "item-1" }));
  });
});

describe("bundle atómico y queries locales", () => {
  it("persiste intento, dos efectos, ítems y outbox; luego permite consultarlos", async () => {
    const items = [item("item-1", "meaning"), item("item-2", "production")];
    const events = [event("event-1", "item-1"), event("event-2", "item-2")];

    await saveAttemptBundle(USER, { attempt, events, updatedItems: items });

    expect(await getLearningItems(USER, ["c1k:on"])).toHaveLength(2);
    expect(await getDueLearningItems(USER, new Date(DUE))).toHaveLength(2);
    expect(await getAttemptLogs(USER, { sessionId: "session-1" })).toEqual([attempt]);
    expect(await getSrsReviewEvents(USER, "item-1")).toEqual([events[0]]);
    const queued = await db.syncOutbox.where("userId").equals(USER).toArray();
    expect(queued.map((entry) => entry.table)).toEqual([
      "learning_items", "learning_items", "attempt_logs", "srs_review_events", "srs_review_events",
    ]);
    expect(new Set(queued.map((entry) => entry.bundleId))).toEqual(new Set([attempt.id]));
  });

  it("acepta un AttemptLog sin eventos ni ítems actualizados", async () => {
    await saveAttemptBundle(USER, { attempt, events: [], updatedItems: [] });
    expect(await getAttemptLogs(USER, { wordId: "c1k:on" })).toEqual([attempt]);
    expect(await db.srsReviewEvents.count()).toBe(0);
  });

  it("rechaza eventos ajenos al intento e ítems sin evento", () => {
    expect(() => validateAttemptBundle({
      attempt,
      events: [{ ...event("event-1", "item-1"), attemptLogId: "attempt-other" }],
      updatedItems: [item("item-1", "meaning")],
    })).toThrow(/attempt/i);
    expect(() => validateAttemptBundle({
      attempt,
      events: [],
      updatedItems: [item("item-1", "meaning")],
    })).toThrow(/evento/i);
  });

  it("rechaza otra cuenta y espejos inconsistentes antes de escribir", async () => {
    const record = toLearningItemRecord(item("item-1", "meaning"), USER, AT);
    await expect(db.transaction("rw", db.learningItems, (tx) =>
      putLearningItemsTx(tx, OTHER, [record]))).rejects.toThrow(/cuenta/i);

    const inconsistent: LearningItemRecord = { ...record, dueAt: "2027-01-01T00:00:00.000Z" };
    await expect(db.transaction("rw", db.learningItems, (tx) =>
      putLearningItemsTx(tx, USER, [inconsistent]))).rejects.toThrow(/espejo/i);
    expect(await db.learningItems.count()).toBe(0);
  });
});
