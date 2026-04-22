// ── Outbox Pattern — Sync Types ──
// Shared types for the offline-first sync queue between Dexie and Supabase.

/** Tables that can be queued for sync */
export type SyncTable = 'user_sound_progress' | 'answer_history' | 'ai_conversations' | 'user_learning_state'

/** DML operations supported */
export type SyncOperation = 'insert' | 'update' | 'upsert' | 'delete'

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
  /** Target Supabase table */
  table: SyncTable
  /** DML operation */
  operation: SyncOperation
  /** Row data (for insert/update/upsert); omit for delete */
  payload: Record<string, unknown>
  /** For update/delete: the WHERE clause fields + values */
  matchKey?: Record<string, unknown>
  /** Current processing status */
  status: SyncStatus
  /** ISO timestamp when the entry was created */
  createdAt: string
  /** ISO timestamp of the last sync attempt */
  lastAttemptAt?: string
  /** Number of failed attempts */
  retryCount: number
  /** Human-readable reason for the last failure */
  errorMessage?: string
}

/** Result returned by the sync manager after a flush pass */
export interface SyncFlushResult {
  synced: number
  failed: number
  skipped: number
}
