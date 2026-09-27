/**
 * Synthetic stand-in for the remote `answer_history` table (plan 045).
 *
 * Mirrors the constraints PostgREST/Postgres enforce on that table so tests
 * reproduce the real rejection causes without touching Supabase or real rows:
 *  - unknown column  → PGRST204 (schema cache)
 *  - non-uuid `id`   → 22P02 (invalid_text_representation)
 *  - context CHECK   → 23514 on `answer_history_context_check`
 * Upserts are keyed by `id`, so a replay of the same row never duplicates it.
 */

/** Columns from types/supabase.ts `answer_history.Row`. */
const ANSWER_HISTORY_COLUMNS = new Set([
  'answered_at', 'content_id', 'context', 'exercise_payload', 'exercise_type_id', 'grade',
  'id', 'is_correct', 'sound_id', 'target_word', 'time_ms', 'topic', 'user_answer', 'user_id',
])

/** CHECK from supabase/migrations/20260616120000_answer_history_contexts.sql. */
export const CONTEXTS_BEFORE_045 = [
  'sound_lab', 'courses', 'ai_coach', 'practice', 'daily', 'core-1000', 'review',
] as const

export const CONTEXTS_AFTER_045 = [...CONTEXTS_BEFORE_045, 'essential-words'] as const

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type RemoteError = { message: string; code: string; details?: string }

export function createAnswerHistoryRemote(allowedContexts: readonly string[]) {
  const rows = new Map<string, Record<string, unknown>>()
  const state = { allowedContexts: new Set<string>(allowedContexts), upsertCalls: 0 }

  function validate(row: Record<string, unknown>): RemoteError | null {
    const unknown = Object.keys(row).find((column) => !ANSWER_HISTORY_COLUMNS.has(column))
    if (unknown) {
      return {
        code: 'PGRST204',
        message: `Could not find the '${unknown}' column of 'answer_history' in the schema cache`,
      }
    }
    if (typeof row.id !== 'string' || !UUID_RE.test(row.id)) {
      return { code: '22P02', message: `invalid input syntax for type uuid: "${String(row.id)}"` }
    }
    if (row.context != null && !state.allowedContexts.has(String(row.context))) {
      return {
        code: '23514',
        message: 'new row for relation "answer_history" violates check constraint "answer_history_context_check"',
        details: `Failing row contains (${String(row.id)}, ${String(row.context)}).`,
      }
    }
    return null
  }

  function upsert(row: Record<string, unknown>) {
    state.upsertCalls++
    const error = validate(row)
    if (!error) rows.set(String(row.id), row)
    return Promise.resolve({ error })
  }

  return {
    rows,
    state,
    upsert,
    /** Simulates applying the plan-045 migration remotely. */
    applyMigration045() {
      state.allowedContexts = new Set(CONTEXTS_AFTER_045)
    },
  }
}

export type AnswerHistoryRemote = ReturnType<typeof createAnswerHistoryRemote>
