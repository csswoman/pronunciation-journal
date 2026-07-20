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
 *
 * `23505` (unique_violation) is intentionally NOT in `permanentCodes` — see
 * `classifyUniqueViolationAsIdempotentSuccess` below for why it needs
 * entry-level context that this function doesn't have, and why globally
 * treating it as permanent (the old behavior) OR globally treating it as
 * safe-to-retry-as-success would both be wrong. The flush loop still treats
 * an un-reclassified 23505 as permanent (see flushOutboxInternal) — this
 * function alone no longer makes that call.
 */
export function isPermanentError(message: string, code?: string): boolean {
  const permanentCodes = ['42501', '23514', '23503', 'PGRST205', '42P01']
  if (code && permanentCodes.includes(code)) return true
  // Supabase REST errors come as strings; check for common keywords
  return (
    message.includes('violates row-level security') ||
    message.includes('violates check constraint') ||
    message.includes('foreign key') ||
    message.includes('user_learning_state')
  )
}

/**
 * Classify a 23505 (unique_violation) for one specific outbox entry.
 *
 * Plan 061 step 4 says: "Treat unique conflicts as idempotent success only
 * when the idempotency key matches; do not globally reclassify 23505."
 *
 * Why this can't be a blanket rule: the client cannot round-trip to Postgres
 * to ask "was my key already applied?" without adding another network call
 * per retry, and a 23505 can legitimately mean "a DIFFERENT row/user's data
 * collided with this write" (a real conflict, not a duplicate of THIS
 * entry). Reclassifying that as success would silently drop a genuine
 * write. So the reclassification must be restricted to entries where WE can
 * prove, from the entry's own shape, that the only thing 23505 could mean is
 * "this exact operation, identified by a key we generated, was already
 * applied":
 *
 *  - `operation === 'rpc'`: the two RPCs this outbox supports
 *    (`apply_word_bank_rating_event`, `apply_topic_srs_rating_event`) both
 *    insert into `srs_rating_events` via `ON CONFLICT (idempotency_key) DO
 *    NOTHING` *inside* the function body (see
 *    supabase/migrations/20260720080000_srs_rating_events.sql) — a duplicate
 *    call is designed to no-op and return normally, never raise. A 23505
 *    surfacing from an RPC call therefore cannot be that internal
 *    ON CONFLICT (it already swallows itself); the only other unique
 *    constraint an RPC could plausibly hit is the ledger's own
 *    `idempotency_key` unique constraint racing with itself under truly
 *    concurrent retries of the SAME entry — which is fine to treat as
 *    success, because `p_idempotency_key` is a UUID generated once by
 *    `buildWordBankRatingEvent`/`buildTopicSrsRatingEvent` and stored on
 *    this exact entry's payload, i.e. only resubmission of this entry could
 *    produce that specific key. It is not derived from server state we'd
 *    have to trust blindly — we generated it, we're the only writer who
 *    could have used it, so seeing OUR OWN key rejected as duplicate proves
 *    OUR OWN earlier attempt already landed.
 *  - Any other operation (plain insert/update/upsert/delete against a
 *    table): these do NOT carry a client-generated idempotency key at all
 *    (their conflict targets are business columns like `user_id,topic` or
 *    `id` — meaningful data, not a value crafted solely to detect retries).
 *    A 23505 here could be this entry's own retry racing itself, but it
 *    could just as easily be two DIFFERENT logical writes (e.g. two
 *    concurrent tabs/devices) colliding on the same natural key — the
 *    client has no way to tell those apart, so it must remain a permanent
 *    failure (previous behavior, preserved).
 *
 * Returns true only when this specific entry's payload demonstrably carries
 * the idempotency key that would have caused the conflict.
 */
export function classifyUniqueViolationAsIdempotentSuccess(entry: SyncOutboxEntry): boolean {
  if (entry.operation !== 'rpc') return false
  const key = (entry.payload as Record<string, unknown> | undefined)?.p_idempotency_key
  return typeof key === 'string' && key.length > 0
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

/**
 * Derive a stable "entity key" for an outbox entry — the identity of the
 * row/logical-record this entry acts on, used to group same-entity entries
 * so they're sent to Postgres in submission order rather than in parallel.
 *
 * Entries that don't share an entity key run concurrently; entries that do
 * (e.g. two ratings queued for the same word_bank row before either synced)
 * are awaited strictly in order. This is a client-side efficiency/ordering
 * guarantee that complements — not replaces — Step 2's server-side row
 * locking: Postgres would still serialize overlapping requests correctly on
 * its own, but guaranteeing order client-side avoids sending the second
 * write before the first is even in flight, which avoids unnecessary lock
 * contention/retries and means client-perceived order matches applied order.
 *
 * - 'rpc': keyed by rpcName + the entity identifier inside the RPC's args
 *   (word_bank rows by `p_word_id`; topic_srs rows by the natural key
 *   `p_user_id`+`p_topic`, since a brand-new topic has no id yet).
 * - DML with a matchKey (update/delete): keyed by table + the matchKey
 *   values — that's the WHERE clause, i.e. the row identity.
 * - upsert without an explicit matchKey: keyed by table + the resolved
 *   onConflict column(s)' values pulled from the payload, since that's the
 *   row identity Postgres will collide on. If the payload is missing one of
 *   those columns (a producer bug — e.g. a table added to
 *   `UPSERT_CONFLICT_COLUMNS` whose enqueue call forgot to include a column),
 *   we do NOT fall through to building a key with a literal `"undefined"` in
 *   it: that would silently coalesce every malformed entry for the table
 *   onto the same entity key and wrongly serialize unrelated writes against
 *   each other. Instead we log loudly and treat the entry as independent
 *   (see fallback below) — the safe direction, since the worst case is a
 *   missed batching optimization, never an incorrect grouping.
 * - insert, or anything else with no derivable identity: no collision
 *   target exists client-side, so each such entry is its own independent
 *   entity (keyed by its own outbox id) and is free to run concurrently
 *   with everything else.
 */
function entityKeyFor(entry: SyncOutboxEntry): string {
  if (entry.operation === 'rpc') {
    const payload = entry.payload as Record<string, unknown>
    const identifier = typeof payload.p_word_id === 'string'
      ? payload.p_word_id
      : `${String(payload.p_user_id ?? '')}:${String(payload.p_topic ?? '')}`
    return `rpc:${entry.rpcName}:${identifier}`
  }

  if (entry.matchKey) {
    const parts = Object.entries(entry.matchKey)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([col, val]) => `${col}=${String(val)}`)
    return `${entry.table}:${parts.join(',')}`
  }

  if (entry.operation === 'upsert') {
    const onConflict = resolveOnConflict(entry)
    if (onConflict) {
      const payload = entry.payload as Record<string, unknown>
      const columns = onConflict.split(',').map((col) => col.trim())
      const missingColumns = columns.filter((col) => payload[col] === undefined)
      if (missingColumns.length > 0) {
        // Malformed entry: payload doesn't carry a value for every resolved
        // onConflict column. Don't build a "undefined"-tainted key that
        // would wrongly group this entry with other malformed entries for
        // the same table — fall through to the independent-entity fallback.
        console.warn(
          `[sync-manager] entityKeyFor: upsert entry for table "${entry.table}" ` +
          `is missing payload value(s) for resolved onConflict column(s) ` +
          `[${missingColumns.join(', ')}] (onConflict="${onConflict}"). ` +
          `Payload keys: [${Object.keys(payload).join(', ')}]. ` +
          `Treating entry ${entry.id} as an independent entity instead of ` +
          `grouping it with other entries for this table.`,
        )
      } else {
        const parts = columns
          .sort((a, b) => a.localeCompare(b))
          .map((col) => `${col}=${String(payload[col])}`)
        return `${entry.table}:${parts.join(',')}`
      }
    }
  }

  // No derivable collision target (e.g. a plain insert, or a malformed
  // upsert missing a conflict-column value) — independent entity.
  return `entry:${entry.id}`
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Enqueue a change to the outbox.
 * Call this INSIDE a Dexie transaction alongside the local write so both
 * are committed atomically (or both roll back).
 *
 * `userId` is the acting/owning account for this entry — the caller must
 * state it explicitly rather than have it inferred from `payload`/`matchKey`
 * shape. Callers already have it in scope (it's the source of truth this
 * entry's ownership metadata comes from); sniffing it out of arbitrary
 * payload fields (`user_id`, `p_user_id`, ...) is fragile and only grows
 * more `??` clauses as new RPCs/payload shapes are added.
 *
 * @example
 * await db.transaction('rw', [db.syncOutbox], async () => {
 *   await db.someTable.put(localRow)
 *   await enqueue(userId, 'user_contrast_progress', 'upsert', payload)
 * })
 */
export async function enqueue(
  userId: string,
  table: SyncTable,
  operation: SyncOperation,
  payload: Record<string, unknown>,
  matchKey?: Record<string, unknown>,
  onConflict?: string,
  rpcName?: SyncRpc,
): Promise<number> {
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
 * Drain the pending queue. Entries for different entities flush
 * concurrently; entries for the same entity (same row/logical record — see
 * `entityKeyFor`) are sent to Postgres strictly in submission order.
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

  // Group by entity so operations on the same logical row are sent to
  // Postgres strictly in submission order (avoids out-of-order/racing
  // writes to one row), while unrelated entities still flush concurrently.
  const groups = new Map<string, SyncOutboxEntry[]>()
  for (const entry of batch) {
    const key = entityKeyFor(entry)
    const group = groups.get(key)
    if (group) group.push(entry)
    else groups.set(key, [entry])
  }

  async function processEntry(entry: SyncOutboxEntry): Promise<void> {
    try {
      await flushEntry(entry)
      await db.syncOutbox.delete(entry.id!)
      result.synced++
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const code = (err as { code?: string }).code

      if (code === '23505' && classifyUniqueViolationAsIdempotentSuccess(entry)) {
        // This entry's own idempotency key was rejected as a duplicate —
        // proof (per classifyUniqueViolationAsIdempotentSuccess's reasoning)
        // that this exact operation already landed. Treat as success.
        await db.syncOutbox.delete(entry.id!)
        result.synced++
        return
      }

      const newRetryCount = entry.retryCount + 1
      const permanent =
        isPermanentError(message, code) || code === '23505' || newRetryCount >= MAX_RETRIES

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
  }

  async function processGroupInOrder(group: SyncOutboxEntry[]): Promise<void> {
    // Intentionally sequential: each entry in a same-entity group must be
    // fully resolved (success or failure recorded) before the next one for
    // that same entity is sent.
    for (const entry of group) {
      await processEntry(entry)
    }
  }

  // Different entities flush concurrently; entries within one entity are
  // strictly ordered (see processGroupInOrder).
  await Promise.allSettled(Array.from(groups.values()).map(processGroupInOrder))

  // Items that were claimed as `syncing` but not resolved (shouldn't happen, but safety net)
  const stuckCount = await db.syncOutbox
    .where('id')
    .anyOf(batch.map((entry) => entry.id!))
    .filter((entry) => entry.status === 'syncing')
    .modify({ status: 'pending' })
  result.skipped += stuckCount

  return result
}

