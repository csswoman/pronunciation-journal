// @vitest-environment node
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { fixedExecutionContext } from "../execution-context";
import { persistAttemptRecord, planAttemptRecord } from "../record-attempt";
import type { AttemptAssessment, LearningItem } from "../verification/types";

const USER = "00000000-0000-4000-8000-000000000001";
const NOW = new Date("2026-08-06T10:00:00.000Z");

const assessment: AttemptAssessment = {
  grade: "Easy",
  modality: "production",
  correct: true,
  latencyMs: 3_000,
  interactionDurationMs: 9_000,
  usedHints: false,
  rescued: false,
  acceptedVariant: false,
  firstTryFailed: false,
  freeAudioReplays: 0,
};

const item = (skill: "meaning" | "production"): LearningItem => ({
  id: `c1k:on#${skill}`,
  wordId: "c1k:on",
  skill,
  contentOrigin: "authored",
  schedule: { kind: "none" },
  repetitions: 0,
  lapses: 0,
  suspended: false,
});

const plan = () => planAttemptRecord({
  wordId: "c1k:on",
  sessionId: "session-1",
  assessment,
  eventType: "verification",
  currentItems: [item("meaning"), item("production")],
}, fixedExecutionContext(NOW, ["attempt-1", "event-1", "event-2"]));

const counts = async () => ({
  attempts: await db.attemptLogs.count(),
  events: await db.srsReviewEvents.count(),
  items: await db.learningItems.count(),
  outbox: await db.syncOutbox.count(),
});

beforeEach(async () => {
  db.close();
  await db.delete();
  await db.open();
});

afterEach(() => db.close());

describe("persistAttemptRecord", () => {
  it.each(["attemptLogs", "srsReviewEvents", "learningItems", "syncOutbox"] as const)(
    "revierte el bundle completo si falla %s",
    async (tableName) => {
      const table = db.table(tableName);
      const failure = () => { throw new Error(`forced ${tableName} failure`); };
      table.hook("creating").subscribe(failure);

      try {
        await expect(persistAttemptRecord(USER, plan())).rejects.toThrow(/forced/i);
      } finally {
        table.hook("creating").unsubscribe(failure);
      }

      expect(await counts()).toEqual({ attempts: 0, events: 0, items: 0, outbox: 0 });
    },
  );

  it("reintenta el mismo bundle sin duplicar registros ni outbox", async () => {
    const bundle = plan();

    await persistAttemptRecord(USER, bundle);
    await persistAttemptRecord(USER, bundle);

    expect(await counts()).toEqual({ attempts: 1, events: 2, items: 2, outbox: 5 });
  });

  it("rechaza un evento huérfano antes de abrir la transacción", async () => {
    const bundle = plan();
    const invalid = {
      ...bundle,
      srsEvents: [{ ...bundle.srsEvents[0], learningItemId: "c1k:on#listening" }],
    };
    const transaction = vi.spyOn(db, "transaction");

    await expect(persistAttemptRecord(USER, invalid)).rejects.toThrow(/evento/i);
    expect(transaction).not.toHaveBeenCalled();
    expect(await counts()).toEqual({ attempts: 0, events: 0, items: 0, outbox: 0 });
  });

  it("persiste dos efectos de una interacción sobre tarjetas distintas", async () => {
    const bundle = plan();
    await persistAttemptRecord(USER, bundle);

    const events = await db.srsReviewEvents.toArray();
    expect(new Set(events.map((event) => event.learningItemId))).toEqual(new Set([
      "c1k:on#meaning",
      "c1k:on#production",
    ]));
    expect(new Set(events.map((event) => event.attemptLogId))).toEqual(new Set(["attempt-1"]));
  });
});
