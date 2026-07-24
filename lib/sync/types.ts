// ── Outbox Pattern — Sync Types ──
// Shared types for the offline-first sync queue between Dexie and Supabase.

/** Tables that can be queued for sync */
export type SyncTable = 'user_contrast_progress' | 'answer_history' | 'activity_sessions' | 'user_learning_state' | 'word_bank' | 'topic_srs' | 'journal_entries' | 'tracked_items' | 'lesson_completions' | 'pronunciation_assessments'

/** RPC functions that can be queued for sync via an 'rpc' operation entry. */
export type SyncRpc = 'apply_word_bank_rating_event' | 'apply_topic_srs_rating_event'

/**
 * DML operations supported, plus 'rpc' — an outbox entry whose `payload` is
 * the RPC's named-args object (passed verbatim to `supabase.rpc(name, args)`)
 * rather than a row to insert/update. Used by the SRS rating-event flow
 * (plan 061 step 3+): the client never computes/asserts an absolute row
 * state, it submits an immutable rating event and lets the server-side RPC
 * apply it under a row lock.
 */
export type SyncOperation = 'insert' | 'update' | 'upsert' | 'delete' | 'rpc'

/** Status lifecycle of an outbox entry */
export type SyncStatus =
  | 'pending'   // waiting to be processed
  | 'syncing'   // currently being sent (prevents double-flush)
  | 'done'      // successfully synced — safe to delete
  | 'failed'    // permanent failure (RLS, validation) — needs manual review

/** A single change queued for remote sync */
export interface SyncOutboxEntry {
  /** Auto-increment local PK */
  id?: number
  /**
   * Account that owns this operation. Never flush another account's work.
   * Set explicitly by the caller of `enqueue()` — never inferred from
   * `payload`/`matchKey` shape (that inference was fragile and prone to
   * false positives from unrelated `user_id`-like fields).
   */
  userId?: string
  /** Target Supabase table. For operation 'rpc', this is unused — see `rpcName`. */
  table: SyncTable
  /** DML operation, or 'rpc' to call a Postgres function instead of table DML. */
  operation: SyncOperation
  /** Row data (for insert/update/upsert); the RPC's named args (for 'rpc'); omit for delete */
  payload: Record<string, unknown>
  /** For update/delete: the WHERE clause fields + values */
  matchKey?: Record<string, unknown>
  /** For upsert: column(s) that define the logical conflict target */
  onConflict?: string
  /** Required when operation is 'rpc': the Postgres function to call. */
  rpcName?: SyncRpc
  /** Current processing status */
  status: SyncStatus
  /** ISO timestamp when the entry was created */
  createdAt: string
  /** ISO timestamp of the last sync attempt */
  lastAttemptAt?: string
  /** Earliest time a transiently failed entry can be retried. */
  nextRetryAt?: string
  /** Number of failed attempts */
  retryCount: number
  /** Human-readable reason for the last failure */
  errorMessage?: string
}

/** Outcome of a single outbox entry's processing within one flush pass. */
export type SyncEntryOutcome = 'synced' | 'failed' | 'skipped'

/**
 * Per-operation result for one outbox entry processed during a flush pass.
 * `id` is the entry's local Dexie PK (present even for `synced`/deleted
 * entries — the id captured at claim-time, before deletion).
 */
export interface SyncOperationOutcome {
  id: number
  table: SyncTable
  operation: SyncOperation
  outcome: SyncEntryOutcome
  /** Populated when outcome is 'failed'. */
  errorMessage?: string
}

/**
 * Result returned by the sync manager after a flush pass.
 *
 * `synced`/`failed`/`skipped` are aggregate counts kept for backward
 * compatibility and quick summaries; `operations` is the authoritative
 * per-entry breakdown they're derived from — the two can never drift
 * because the counts are computed FROM `operations`, never tracked
 * independently (see `flushOutboxInternal`).
 */
export interface SyncFlushResult {
  synced: number
  failed: number
  skipped: number
  /** Per-entry outcomes for every operation processed in this flush pass. */
  operations: SyncOperationOutcome[]
}
