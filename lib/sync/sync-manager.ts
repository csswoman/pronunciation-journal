/**
 * Sync Manager — Outbox Pattern
 *
 * Responsibilities:
 *  1. Enqueue local changes to `syncOutbox` inside Dexie transactions.
 *  2. Flush the queue to Supabase when connectivity is detected.
 *  3. Mark failed entries (RLS / validation) without blocking other items.
 *  4. Flush on reconnection through `init-sync-listeners.ts`.
 */

import Dexie from 'dexie'
import { db } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SyncOutboxEntry, SyncFlushResult, SyncTable, SyncOperation, SyncRpc } from './types'
import { getNextRetryAt, isReadyToRetry, reclaimStaleSyncingEntries } from './recovery'

// ── Constants ──────────────────────────────────────────────────────────────

/** Max retries before an entry is permanently marked `failed` */
const MAX_RETRIES = 3

/** Entries processed per flush pass (prevents oversized batch requests) */
const FLUSH_BATCH_SIZE = 30

// ── Internal helpers ───────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}

const UPSERT_CONFLICT_COLUMNS: Partial<Record<SyncTable, string>> = {
  answer_history: 'id',
  activity_sessions: 'id',
  user_contrast_progress: 'user_id,contrast_id',
  user_learning_state: 'user_id',
  journal_entries: 'id',
  lesson_completions: 'user_id,course_slug,lesson_slug',
}

let flushInFlight: Promise<SyncFlushResult> | null = null

function resolveOnConflict(entry: SyncOutboxEntry): string | undefined {
  return entry.onConflict ?? UPSERT_CONFLICT_COLUMNS[entry.table]
}

/**
 * Determine whether a Supabase error should be retried or treated as permanent.
 * RLS violations (code 42501) and check-constraint errors (23514) are permanent.
 */
export function isPermanentError(message: string, code?: string): boolean {
  const permanentCodes = ['42501', '23514', '23503', '23505', 'PGRST205', '42P01']
  if (code && permanentCodes.includes(code)) return true
  // Supabase REST errors come as strings; check for common keywords
  return (
    message.includes('violates row-level security') ||
    message.includes('violates check constraint') ||
    message.includes('foreign key') ||
    message.includes('duplicate key') ||
    message.includes('user_learning_state')
  )
}

// ── Flush logic ────────────────────────────────────────────────────────────

async function flushEntry(entry: SyncOutboxEntry): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { operation, payload, matchKey } = entry
  const onConflict = resolveOnConflict(entry)
  // Cast table to any because generated browser types intentionally lag a
  // few already-migrated outbox targets.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const table = entry.table as any

  let error: { message: string; code?: string } | null = null

  switch (operation) {
    case 'insert': {
      const res = await supabase.from(table).insert(payload as never)
      error = res.error
      break
    }
    case 'upsert': {
      const res = await supabase.from(table).upsert(payload as never, onConflict ? { onConflict } : undefined)
      error = res.error
      break
    }
    case 'update': {
      if (!matchKey) throw new Error('update operation requires matchKey')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase.from(table).update(payload as never)
      for (const [col, val] of Object.entries(matchKey)) {
        query = query.eq(col, val)
      }
      const res = await query
      error = res.error
      break
    }
    case 'delete': {
      if (!matchKey) throw new Error('delete operation requires matchKey')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query: any = supabase.from(table).delete()
      for (const [col, val] of Object.entries(matchKey)) {
        query = query.eq(col, val)
      }
      const res = await query
      error = res.error
      break
    }
    case 'rpc': {
      if (!entry.rpcName) throw new Error('rpc operation requires rpcName')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const res = await supabase.rpc(entry.rpcName as any, payload as never)
      error = res.error
      break
    }
  }

  if (error) {
    throw Object.assign(new Error(error.message), { code: (error as { code?: string }).code })
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Enqueue a change to the outbox.
 * Call this INSIDE a Dexie transaction alongside the local write so both
 * are committed atomically (or both roll back).
 *
 * @example
 * await db.transaction('rw', [db.syncOutbox], async () => {
 *   await db.someTable.put(localRow)
 *   await enqueue('user_contrast_progress', 'upsert', payload)
 * })
 */
export async function enqueue(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  matchKey?: Record<string, unknown>,
  onConflict?: string,
  rpcName?: SyncRpc,
): Promise<number> {
  // RPC payloads name their args after the Postgres function's parameters
  // (p_user_id, by convention across this codebase's RPCs — see
  // apply_word_bank_rating_event / apply_topic_srs_rating_event), so check
  // that shape too alongside the DML payload/matchKey shapes.
  const userId = payload.user_id ?? payload.userId ?? payload.p_user_id ?? matchKey?.user_id ?? matchKey?.userId
  if (typeof userId !== 'string' || !userId) {
    throw new Error(`Outbox entry for ${table} requires an explicit user_id`)
  }
  if (operation === 'rpc' && !rpcName) {
    throw new Error('rpc operation requires rpcName')
  }
  const entry: SyncOutboxEntry = {
    userId,
    table,
    operation,
    payload,
    matchKey,
    onConflict,
    rpcName,
    status: 'pending',
    createdAt: now(),
    retryCount: 0,
  }
  return db.syncOutbox.add(entry)
}

/**
 * Drain the pending queue, sending entries independently in parallel.
 * A tab shares one in-flight pass; across tabs, cleanup is scoped to the ids
 * claimed by this pass so it never releases another tab's active work.
 *
 * Returns a summary of what happened during this flush pass.
 */
export function flushOutbox(userId?: string): Promise<SyncFlushResult> {
  if (!userId) return Promise.resolve({ synced: 0, failed: 0, skipped: 0 })
  if (flushInFlight) return flushInFlight
  flushInFlight = flushOutboxInternal(userId).finally(() => { flushInFlight = null })
  return flushInFlight
}

async function flushOutboxInternal(userId: string): Promise<SyncFlushResult> {
  await reclaimStaleSyncingEntries()
  if (!navigator.onLine) return { synced: 0, failed: 0, skipped: 0 }

  const result: SyncFlushResult = { synced: 0, failed: 0, skipped: 0 }

  // Claim a batch atomically: pending → syncing
  const batch = await db.transaction('rw', db.syncOutbox, async () => {
    const pending = (await db.syncOutbox
      .where('[userId+status+createdAt]')
      .between([userId, 'pending', Dexie.minKey], [userId, 'pending', Dexie.maxKey])
      .toArray())
      .filter((entry) => isReadyToRetry(entry.nextRetryAt, Date.now()))
      .slice(0, FLUSH_BATCH_SIZE)

    const ids = pending.map(e => e.id!)
    await db.syncOutbox.where('id').anyOf(ids).modify({ status: 'syncing', lastAttemptAt: now() })
    return pending
  })

  if (batch.length === 0) return result

  // Process each entry independently so one failure doesn't block others
  await Promise.allSettled(
    batch.map(async (entry) => {
      try {
        await flushEntry(entry)
        await db.syncOutbox.delete(entry.id!)
        result.synced++
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        const code = (err as { code?: string }).code

        const newRetryCount = entry.retryCount + 1
        const permanent = isPermanentError(message, code) || newRetryCount >= MAX_RETRIES

        const attemptedAt = now()
        await db.syncOutbox.update(entry.id!, {
          status: permanent ? 'failed' : 'pending',
          retryCount: newRetryCount,
          errorMessage: message,
          lastAttemptAt: attemptedAt,
          nextRetryAt: permanent ? undefined : getNextRetryAt(newRetryCount, attemptedAt),
        })
        result.failed++
      }
    })
  )

  // Items that were claimed as `syncing` but not resolved (shouldn't happen, but safety net)
  const stuckCount = await db.syncOutbox
    .where('id')
    .anyOf(batch.map((entry) => entry.id!))
    .filter((entry) => entry.status === 'syncing')
    .modify({ status: 'pending' })
  result.skipped += stuckCount

  return result
}

