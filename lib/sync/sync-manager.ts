/**
 * Sync Manager — Outbox Pattern
 *
 * Responsibilities:
 *  1. Enqueue local changes to `syncOutbox` inside Dexie transactions.
 *  2. Flush the queue to Supabase when connectivity is detected.
 *  3. Mark failed entries (RLS / validation) without blocking other items.
 *  4. Listen for online/offline events and auto-flush on reconnection.
 */

import Dexie from 'dexie'
import { db } from '@/lib/db'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { SyncOutboxEntry, SyncFlushResult, SyncTable, SyncOperation } from './types'

// ── Constants ──────────────────────────────────────────────────────────────

/** Max retries before an entry is permanently marked `failed` */
const MAX_RETRIES = 3

/** Entries processed per flush pass (prevents oversized batch requests) */
const FLUSH_BATCH_SIZE = 30

// ── Internal helpers ───────────────────────────────────────────────────────

function now(): string {
  return new Date().toISOString()
}

/**
 * Determine whether a Supabase error should be retried or treated as permanent.
 * RLS violations (code 42501) and check-constraint errors (23514) are permanent.
 */
function isPermanentError(message: string, code?: string): boolean {
  const permanentCodes = ['42501', '23514', '23503', '23505']
  if (code && permanentCodes.includes(code)) return true
  // Supabase REST errors come as strings; check for common keywords
  return (
    message.includes('violates row-level security') ||
    message.includes('violates check constraint') ||
    message.includes('foreign key') ||
    message.includes('duplicate key')
  )
}

// ── Flush logic ────────────────────────────────────────────────────────────

async function flushEntry(entry: SyncOutboxEntry): Promise<void> {
  const supabase = getSupabaseBrowserClient()
  const { table, operation, payload, matchKey } = entry

  let error: { message: string; code?: string } | null = null

  switch (operation) {
    case 'insert': {
      const res = await supabase.from(table).insert(payload as never)
      error = res.error
      break
    }
    case 'upsert': {
      const res = await supabase.from(table).upsert(payload as never)
      error = res.error
      break
    }
    case 'update': {
      if (!matchKey) throw new Error('update operation requires matchKey')
      let query = supabase.from(table).update(payload as never)
      for (const [col, val] of Object.entries(matchKey)) {
        query = (query as ReturnType<typeof query.eq>).eq(col, val as never)
      }
      const res = await (query as ReturnType<typeof query.eq>)
      error = res.error
      break
    }
    case 'delete': {
      if (!matchKey) throw new Error('delete operation requires matchKey')
      let query = supabase.from(table).delete()
      for (const [col, val] of Object.entries(matchKey)) {
        query = (query as ReturnType<typeof query.eq>).eq(col, val as never)
      }
      const res = await (query as ReturnType<typeof query.eq>)
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
 *   await enqueue('user_sound_progress', 'upsert', payload)
 * })
 */
export async function enqueue(
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  matchKey?: Record<string, unknown>
): Promise<number> {
  const entry: SyncOutboxEntry = {
    table,
    operation,
    payload,
    matchKey,
    status: 'pending',
    createdAt: now(),
    retryCount: 0,
  }
  return db.syncOutbox.add(entry)
}

/**
 * Drain the pending queue, sending entries to Supabase one by one.
 * Safe to call concurrently — `syncing` status prevents double-processing.
 *
 * Returns a summary of what happened during this flush pass.
 */
export async function flushOutbox(): Promise<SyncFlushResult> {
  if (!navigator.onLine) return { synced: 0, failed: 0, skipped: 0 }

  const result: SyncFlushResult = { synced: 0, failed: 0, skipped: 0 }

  // Claim a batch atomically: pending → syncing
  const batch = await db.transaction('rw', db.syncOutbox, async () => {
    const pending = await db.syncOutbox
      .where('[status+createdAt]')
      .between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
      .limit(FLUSH_BATCH_SIZE)
      .toArray()

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

        await db.syncOutbox.update(entry.id!, {
          status: permanent ? 'failed' : 'pending',
          retryCount: newRetryCount,
          errorMessage: message,
          lastAttemptAt: now(),
        })
        result.failed++
      }
    })
  )

  // Items that were claimed as `syncing` but not resolved (shouldn't happen, but safety net)
  const stuckCount = await db.syncOutbox
    .where('status')
    .equals('syncing')
    .modify({ status: 'pending' })
  result.skipped += stuckCount

  return result
}

// ── Connectivity listener ──────────────────────────────────────────────────

let _listenerAttached = false

/**
 * Register a global `online` event listener that auto-flushes the outbox
 * whenever the browser regains connectivity.
 * Safe to call multiple times — only registers once.
 */
export function startSyncListener(): void {
  if (typeof window === 'undefined' || _listenerAttached) return
  _listenerAttached = true

  window.addEventListener('online', () => {
    flushOutbox().catch(console.error)
  })

  // Also flush immediately if we're already online at mount time
  if (navigator.onLine) {
    flushOutbox().catch(console.error)
  }
}

// ── Outbox status helpers ──────────────────────────────────────────────────

/** Count entries by status — useful for UI indicators */
export async function getOutboxCounts(): Promise<Record<string, number>> {
  const [pending, syncing, failed] = await Promise.all([
    db.syncOutbox.where('status').equals('pending').count(),
    db.syncOutbox.where('status').equals('syncing').count(),
    db.syncOutbox.where('status').equals('failed').count(),
  ])
  return { pending, syncing, failed }
}

/** Retrieve all permanently failed entries for inspection / manual retry */
export async function getFailedEntries(): Promise<SyncOutboxEntry[]> {
  return db.syncOutbox.where('status').equals('failed').toArray()
}

/** Reset a failed entry back to pending so it will be retried */
export async function retryFailed(id: number): Promise<void> {
  await db.syncOutbox.update(id, { status: 'pending', retryCount: 0, errorMessage: undefined })
}

/** Delete a permanently failed entry (manual discard) */
export async function discardFailed(id: number): Promise<void> {
  await db.syncOutbox.delete(id)
}
