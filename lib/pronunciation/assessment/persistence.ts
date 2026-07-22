"use client";

/**
 * Offline-first client persistence for the pronunciation diagnostic (plan
 * 067, step 6).
 *
 * Distinct from `persistence-server.ts` (used only by the API route, which
 * is already online/authenticated and writes directly to Supabase). This
 * module is for the client/offline flow: write a local Dexie mirror
 * (`db.pronunciationAssessments`) so a diagnostic completed offline survives
 * a refresh, then enqueue an outbox entry so it syncs once connectivity is
 * available.
 *
 * Idempotency for retries: this table's `id` is a client-generated uuid used
 * as the literal primary key (see the migration
 * `supabase/migrations/20260721200000_create_pronunciation_assessments.sql`),
 * so `pronunciation_assessments` is listed in
 * `TABLES_WITH_CLIENT_GENERATED_ID_IDEMPOTENCY` in `lib/sync/sync-manager.ts`
 * — a 23505 on a retried plain `insert` for this table is reclassified by
 * `classifyUniqueViolationAsIdempotentSuccess` as idempotent success (the
 * row already landed from an earlier attempt whose outbox-entry delete was
 * lost), not a permanent failure. This module also keeps its own belt-and-
 * suspenders guard: before enqueueing, it checks the local mirror's
 * `syncedAt` flag and skips re-enqueueing an id that's already known to have
 * synced. The server route (`persistence-server.ts`) additionally treats a
 * 23505 on this table as an idempotent success as defense-in-depth, since
 * the local flag can't observe a sync that succeeded on a different
 * device/tab.
 */

import { randomUUID } from 'crypto'
import { db, type PronunciationAssessmentRecord } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { SyncFlushResult } from '@/lib/sync/types'
import { validateDiagnosticResult, type PronunciationDiagnosticResult } from './schema'

export const PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION = 1

export type PersistAssessmentLocalResult =
  | { ok: true; id: string }
  | { ok: false; error: 'invalid_result' }

/**
 * Generates a client-side id, validates the result, writes the local Dexie
 * mirror, and enqueues an outbox insert — all atomically in one Dexie
 * transaction. Call this from the client/offline completion flow (works
 * whether the browser is online or offline; the outbox flushes on
 * reconnect).
 */
export async function persistPronunciationAssessmentLocal(
  userId: string,
  result: PronunciationDiagnosticResult,
  schemaVersion: number = PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION
): Promise<PersistAssessmentLocalResult> {
  const validated = validateDiagnosticResult(result)
  if (!validated.ok) return { ok: false, error: 'invalid_result' }

  const id = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : randomUUID()
  const createdAt = new Date().toISOString()

  const record: PronunciationAssessmentRecord = {
    id,
    userId,
    schemaVersion,
    result: validated.result as unknown as Record<string, unknown>,
    completedAt: validated.result.completedAt,
    createdAt,
  }

  await db.transaction('rw', [db.pronunciationAssessments, db.syncOutbox], async () => {
    await db.pronunciationAssessments.put(record)
    await enqueue(userId, 'pronunciation_assessments', 'insert', {
      id,
      user_id: userId,
      schema_version: schemaVersion,
      result: validated.result,
      completed_at: validated.result.completedAt,
    })
  })

  return { ok: true, id }
}

/**
 * Re-enqueues an outbox insert for a locally mirrored assessment that
 * hasn't synced yet — e.g. a caller wants to force a retry outside the
 * normal reconnect/backoff flow. No-ops (returns `false`) if the row is
 * missing or already marked synced, so callers can't accidentally queue a
 * duplicate insert for an id already known to have landed.
 */
export async function retrySyncPronunciationAssessment(id: string): Promise<boolean> {
  const row = await db.pronunciationAssessments.get(id)
  if (!row || row.syncedAt) return false

  await enqueue(row.userId, 'pronunciation_assessments', 'insert', {
    id: row.id,
    user_id: row.userId,
    schema_version: row.schemaVersion,
    result: row.result,
    completed_at: row.completedAt,
  })
  return true
}

/** Marks a locally mirrored assessment as synced (called by the flush success path). */
export async function markPronunciationAssessmentSynced(id: string): Promise<void> {
  await db.pronunciationAssessments.update(id, { syncedAt: new Date().toISOString() })
}

/**
 * True if this id is already known (locally) to have synced — used to skip
 * re-enqueueing a duplicate outbox entry for an assessment that already
 * landed, since a plain insert's 23505 isn't auto-treated as success.
 */
export async function isPronunciationAssessmentSynced(id: string): Promise<boolean> {
  const row = await db.pronunciationAssessments.get(id)
  return !!row?.syncedAt
}

/**
 * Marks any locally mirrored assessment ids that this flush pass reports as
 * `synced` for the `pronunciation_assessments` table. Call with the result
 * of `flushOutbox(userId)` (e.g. from `initSyncListeners`'s drain callback,
 * or directly after a manual flush) so `isPronunciationAssessmentSynced`
 * stays accurate for the enqueue-skip idempotency guard.
 *
 * Outbox entries don't carry the mirror row's `id` directly in
 * `SyncOperationOutcome` (only `table`/`operation`/`outcome`), so this
 * cannot map a synced outcome back to a specific assessment id from
 * `flushOutbox`'s result alone. Instead, since a synced `insert` outcome for
 * this table means "every pending pronunciation_assessments insert in this
 * batch that didn't fail has landed," this reconciles by re-reading local
 * rows with no `syncedAt` and marking them synced if flushOutbox reported at
 * least one successful insert for this table in this pass. This is a
 * best-effort reconciliation, not a precise per-row map — acceptable because
 * the guard it feeds is itself a belt-and-suspenders optimization (the
 * server route's 23505-as-success handling is the authoritative idempotency
 * backstop).
 */
export async function reconcileLocalSyncStatus(
  userId: string,
  flushResult: SyncFlushResult
): Promise<void> {
  const syncedInsertForTable = flushResult.operations.some(
    (op) => op.table === 'pronunciation_assessments' && op.operation === 'insert' && op.outcome === 'synced'
  )
  if (!syncedInsertForTable) return

  const unsynced = await db.pronunciationAssessments
    .where('userId')
    .equals(userId)
    .filter((row) => !row.syncedAt)
    .toArray()

  const syncedAt = new Date().toISOString()
  await Promise.all(unsynced.map((row) => db.pronunciationAssessments.update(row.id, { syncedAt })))
}

/** All locally mirrored assessments for a user, most recent first. */
export async function getLocalPronunciationAssessments(
  userId: string
): Promise<PronunciationAssessmentRecord[]> {
  const rows = await db.pronunciationAssessments.where('userId').equals(userId).toArray()
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
