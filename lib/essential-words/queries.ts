import Dexie, { type Transaction } from "dexie";
import {
  db,
  type AttemptLogRecord,
  type LearningItemRecord,
  type SrsReviewEventRecord,
} from "@/lib/db";
import type { SyncOutboxEntry } from "@/lib/sync/types";
import type {
  AttemptAssessment,
  AttemptEventType,
  AttemptLog,
  ItemSchedule,
  LearningItem,
  PlacementInference,
  Skill,
  SkillObservation,
  SrsReviewEvent,
  UsagePayload,
} from "./verification/types";
import type { InitialListeningLevel } from "./initial-listening-level";

export interface LearningItemRow {
  id: string; user_id: string; word_id: string; skill: Skill;
  content_origin: LearningItem["contentOrigin"]; generator_provider: "gemini" | null;
  payload: UsagePayload | null; placement_inference: PlacementInference | null;
  initial_listening_level: InitialListeningLevel | null;
  schedule: ItemSchedule; schedule_kind: ItemSchedule["kind"]; due_at: string | null;
  last_review: string | null; repetitions: number; lapses: number;
  suspended: boolean; updated_at: string;
}
export interface AttemptLogRow {
  id: string; user_id: string; session_id: string; word_id: string;
  assessment: AttemptAssessment; observations: SkillObservation[];
  event_type: AttemptEventType; occurred_at: string; rendered_mode?: AttemptLog["renderedMode"] | null; diagnostic?: AttemptLog["diagnostic"] | null;
}
export interface SrsReviewEventRow {
  id: string; user_id: string; attempt_log_id: string; learning_item_id: string;
  grade: SrsReviewEvent["grade"]; assessment: AttemptAssessment;
  prior_schedule: ItemSchedule; resulting_schedule: ItemSchedule;
  occurred_at: string; affects_schedule: true; fsrs_audit: SrsReviewEvent["fsrsAudit"];
}
export interface AttemptPersistenceBundle {
  attempt: AttemptLog;
  events: SrsReviewEvent[];
  updatedItems: LearningItem[];
  /** Initial base items written with an evidence-only attempt, without an SRS event. */
  seedItems?: LearningItem[];
}
export interface AttemptLogFilters {
  sessionId?: string;
  wordId?: string;
  from?: string;
  to?: string;
}
type MirrorReporter = (details: {
  itemId: string; canonicalKind: ItemSchedule["kind"]; mirrorKind: ItemSchedule["kind"];
  canonicalDueAt?: string; mirrorDueAt?: string;
}) => void;

const canonicalDueAt = (schedule: ItemSchedule): string | undefined =>
  schedule.kind === "none" ? undefined : schedule.dueAt;

export function toLearningItemRecord(
  item: LearningItem, userId: string, updatedAt: string,
): LearningItemRecord {
  return {
    ...item, userId, updatedAt, scheduleKind: item.schedule.kind,
    ...(canonicalDueAt(item.schedule) ? { dueAt: canonicalDueAt(item.schedule) } : {}),
  };
}

export const toAttemptLogRecord = (attempt: AttemptLog, userId: string): AttemptLogRecord =>
  ({ ...attempt, userId, synced: false });

export const toSrsReviewEventRecord = (
  event: SrsReviewEvent, userId: string,
): SrsReviewEventRecord => ({ ...event, userId, synced: false });

export function toLearningItemRow(record: LearningItemRecord): LearningItemRow {
  validateLearningItemRecord(record);
  return {
    id: record.id, user_id: record.userId, word_id: record.wordId, skill: record.skill,
    content_origin: record.contentOrigin, generator_provider: record.generatorProvider ?? null,
    payload: record.payload ?? null, placement_inference: record.placementInference ?? null,
    initial_listening_level: record.skill === "listening" ? record.initialListeningLevel ?? null : null,
    schedule: record.schedule, schedule_kind: record.scheduleKind, due_at: record.dueAt ?? null,
    last_review: record.lastReview ?? null, repetitions: record.repetitions,
    lapses: record.lapses, suspended: record.suspended, updated_at: record.updatedAt,
  };
}

export function fromLearningItemRow(
  row: LearningItemRow,
  report: MirrorReporter = (details) => console.warn("[essential-words] schedule mirror mismatch", details),
): LearningItem {
  const dueAt = canonicalDueAt(row.schedule);
  if (row.schedule_kind !== row.schedule.kind || (row.due_at ?? undefined) !== dueAt) {
    report({
      itemId: row.id, canonicalKind: row.schedule.kind, mirrorKind: row.schedule_kind,
      canonicalDueAt: dueAt, mirrorDueAt: row.due_at ?? undefined,
    });
  }
  return {
    id: row.id, wordId: row.word_id, skill: row.skill, contentOrigin: row.content_origin,
    ...(row.generator_provider ? { generatorProvider: row.generator_provider } : {}),
    ...(row.payload ? { payload: row.payload } : {}),
    ...(row.placement_inference ? { placementInference: row.placement_inference } : {}),
    ...(row.skill === "listening" && row.initial_listening_level
      ? { initialListeningLevel: row.initial_listening_level }
      : {}),
    schedule: row.schedule, ...(row.last_review ? { lastReview: row.last_review } : {}),
    repetitions: row.repetitions, lapses: row.lapses, suspended: row.suspended,
  } as LearningItem;
}

export const toAttemptLogRow = (record: AttemptLogRecord): AttemptLogRow => ({
  id: record.id, user_id: record.userId, session_id: record.sessionId, word_id: record.wordId,
  assessment: record.assessment, observations: record.observations,
  event_type: record.eventType, occurred_at: record.occurredAt, rendered_mode: record.renderedMode ?? null, diagnostic: record.diagnostic ?? null,
});

export const fromAttemptLogRow = (row: AttemptLogRow): AttemptLog => ({
  id: row.id, sessionId: row.session_id, wordId: row.word_id, assessment: row.assessment,
  observations: row.observations, eventType: row.event_type, occurredAt: row.occurred_at,
  ...(row.rendered_mode ? { renderedMode: row.rendered_mode } : {}),
  ...(row.diagnostic ? { diagnostic: row.diagnostic } : {}),
});

export const toSrsReviewEventRow = (record: SrsReviewEventRecord): SrsReviewEventRow => ({
  id: record.id, user_id: record.userId, attempt_log_id: record.attemptLogId,
  learning_item_id: record.learningItemId, grade: record.grade, assessment: record.assessment,
  prior_schedule: record.priorSchedule, resulting_schedule: record.resultingSchedule,
  occurred_at: record.occurredAt, affects_schedule: true, fsrs_audit: record.fsrsAudit,
});

export const fromSrsReviewEventRow = (row: SrsReviewEventRow): SrsReviewEvent => ({
  id: row.id, attemptLogId: row.attempt_log_id, learningItemId: row.learning_item_id,
  grade: row.grade, assessment: row.assessment, priorSchedule: row.prior_schedule,
  resultingSchedule: row.resulting_schedule, occurredAt: row.occurred_at,
  affectsSchedule: true, fsrsAudit: row.fsrs_audit,
});

const fromLearningItemRecord = (record: LearningItemRecord): LearningItem =>
  fromLearningItemRow(toLearningItemRow(record));
const fromAttemptLogRecord = (record: AttemptLogRecord): AttemptLog =>
  fromAttemptLogRow(toAttemptLogRow(record));
const fromEventRecord = (record: SrsReviewEventRecord): SrsReviewEvent =>
  fromSrsReviewEventRow(toSrsReviewEventRow(record));

export async function getLearningItems(userId: string, wordIds?: string[]): Promise<LearningItem[]> {
  const records = await db.learningItems.where("userId").equals(userId).toArray();
  const wanted = wordIds ? new Set(wordIds) : undefined;
  return records.filter((record) => !wanted || wanted.has(record.wordId)).map(fromLearningItemRecord);
}

export async function getDueLearningItems(userId: string, now: Date): Promise<LearningItem[]> {
  const records = await db.learningItems.where("[userId+dueAt]")
    .between([userId, Dexie.minKey], [userId, now.toISOString()], true, true).toArray();
  return records.map(fromLearningItemRecord);
}

export async function getAttemptLogs(
  userId: string, filters: AttemptLogFilters = {},
): Promise<AttemptLog[]> {
  const records = await db.attemptLogs.where("userId").equals(userId).toArray();
  return records.filter((record) =>
    (!filters.sessionId || record.sessionId === filters.sessionId)
    && (!filters.wordId || record.wordId === filters.wordId)
    && (!filters.from || record.occurredAt >= filters.from)
    && (!filters.to || record.occurredAt <= filters.to))
    .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)).map(fromAttemptLogRecord);
}

export async function getSrsReviewEvents(
  userId: string, learningItemId: string,
): Promise<SrsReviewEvent[]> {
  const records = await db.srsReviewEvents.where("[userId+learningItemId]")
    .equals([userId, learningItemId]).sortBy("occurredAt");
  return records.map(fromEventRecord);
}

function validateLearningItemRecord(record: LearningItemRecord): void {
  if (record.scheduleKind !== record.schedule.kind || record.dueAt !== canonicalDueAt(record.schedule)) {
    throw new Error(`Espejo de schedule inconsistente para ${record.id}`);
  }
}

function assertOwner(userId: string, records: Array<{ userId: string }>): void {
  if (records.some((record) => record.userId !== userId)) {
    throw new Error("La escritura contiene datos de otra cuenta");
  }
}

export async function putLearningItemsTx(
  tx: Transaction, userId: string, records: LearningItemRecord[],
): Promise<void> {
  assertOwner(userId, records);
  records.forEach(validateLearningItemRecord);
  if (records.length) await tx.table<LearningItemRecord>("learningItems").bulkPut(records);
}

export async function putAttemptLogTx(
  tx: Transaction, userId: string, record: AttemptLogRecord,
): Promise<void> {
  assertOwner(userId, [record]);
  await tx.table<AttemptLogRecord>("attemptLogs").put(record);
}

export async function putSrsReviewEventsTx(
  tx: Transaction, userId: string, records: SrsReviewEventRecord[],
): Promise<void> {
  assertOwner(userId, records);
  if (records.length) await tx.table<SrsReviewEventRecord>("srsReviewEvents").bulkPut(records);
}

export async function putOutboxEntriesTx(
  tx: Transaction, userId: string, entries: SyncOutboxEntry[],
): Promise<void> {
  assertOwner(userId, entries.map((entry) => ({ userId: entry.userId ?? "" })));
  if (entries.length) await tx.table<SyncOutboxEntry>("syncOutbox").bulkAdd(entries);
}

export function validateAttemptBundle(bundle: AttemptPersistenceBundle): void {
  const itemIds = new Set(bundle.updatedItems.map((item) => item.id));
  const eventItemIds = new Set(bundle.events.map((event) => event.learningItemId));
  if (bundle.events.some((event) => event.attemptLogId !== bundle.attempt.id)) {
    throw new Error("Evento vinculado a otro attemptLogId");
  }
  if (bundle.updatedItems.some((item) => !eventItemIds.has(item.id))) {
    throw new Error("Ítem actualizado sin evento correspondiente");
  }
  if (bundle.events.some((event) => !itemIds.has(event.learningItemId))) {
    throw new Error("Evento sin ítem actualizado correspondiente");
  }
  if ((bundle.seedItems ?? []).some((item) => itemIds.has(item.id))) {
    throw new Error("Ítem inicial duplicado en el bundle");
  }
}

export async function saveAttemptBundle(
  userId: string, bundle: AttemptPersistenceBundle,
): Promise<void> {
  if (!userId) throw new Error("El bundle requiere una cuenta");
  validateAttemptBundle(bundle);
  const attempt = toAttemptLogRecord(bundle.attempt, userId);
  const events = bundle.events.map((event) => toSrsReviewEventRecord(event, userId));
  const items = [...(bundle.seedItems ?? []), ...bundle.updatedItems]
    .map((item) => toLearningItemRecord(item, userId, bundle.attempt.occurredAt));
  const base = { userId, status: "pending" as const, createdAt: bundle.attempt.occurredAt, retryCount: 0, bundleId: bundle.attempt.id };
  const outbox: SyncOutboxEntry[] = [
    ...items.map((record) => ({ ...base, table: "learning_items" as const, operation: "upsert" as const,
      payload: { ...toLearningItemRow(record) }, onConflict: "user_id,id" })),
    { ...base, table: "attempt_logs", operation: "insert", payload: { ...toAttemptLogRow(attempt) } },
    ...events.map((record) => ({ ...base, table: "srs_review_events" as const, operation: "insert" as const,
      payload: { ...toSrsReviewEventRow(record) } })),
  ];
  await db.transaction("rw", db.learningItems, db.attemptLogs, db.srsReviewEvents, db.syncOutbox, async (tx) => {
    await putAttemptLogTx(tx, userId, attempt);
    await putSrsReviewEventsTx(tx, userId, events);
    await putLearningItemsTx(tx, userId, items);

    // Entity writes are `put`s keyed by stable plan IDs. Keep the outbox
    // equally idempotent: retrying a local bundle while it is still pending
    // must not enqueue a second remote copy of its attempt and effects.
    const existingOutbox = await tx.table<SyncOutboxEntry>("syncOutbox").toArray();
    const bundleAlreadyQueued = existingOutbox.some((entry) =>
      entry.userId === userId && entry.bundleId === bundle.attempt.id);
    if (!bundleAlreadyQueued) await putOutboxEntriesTx(tx, userId, outbox);
  });
}
