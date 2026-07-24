/**
 * Server-side persistence for the pronunciation diagnostic (plan 067, step 6).
 *
 * Used only by `app/api/pronunciation-assessment/route.ts`, which already
 * runs authenticated (via `requireUser`) and has a real Supabase server
 * client scoped to the request's session — there is no outbox/offline
 * concern here, this is a direct, already-online write.
 *
 * The row `id` is accepted from the caller (client-generated uuid) so a
 * retried submission (e.g. the client's outbox retrying after a dropped
 * response) is a safe no-op: a second insert with the same primary key hits
 * the unique constraint and is treated as an idempotent success rather than
 * a duplicate row (see `isDuplicateAssessmentInsertError` below and its use
 * in the outbox path, `persistence.ts`).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { validateDiagnosticResult, type PronunciationDiagnosticResult } from './schema'

export const PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION = 1

export interface PersistAssessmentServerInput {
  /** Client-generated row id (uuid) — required for idempotent retries. */
  id: string
  userId: string
  result: PronunciationDiagnosticResult
  schemaVersion?: number
}

export type PersistAssessmentServerResult =
  | { ok: true; alreadyPersisted: boolean }
  | { ok: false; error: 'invalid_result' | 'user_mismatch' | 'db_error'; detail?: string }

/** Postgres unique_violation. A retry of the same client-generated `id` lands here. */
const UNIQUE_VIOLATION_CODE = '23505'

/**
 * Validates and inserts one diagnostic result row directly via an
 * authenticated, request-scoped Supabase client. RLS still enforces
 * user-scoping at the database layer; the `userId`/`result.userId` match
 * check here is defense-in-depth against a client sending a mismatched body
 * (see the API route, which pairs this with `requireUser`).
 */
export async function persistPronunciationAssessmentServer(
  supabase: SupabaseClient<Database>,
  input: PersistAssessmentServerInput
): Promise<PersistAssessmentServerResult> {
  const { id, userId, result, schemaVersion = PRONUNCIATION_DIAGNOSTIC_SCHEMA_VERSION } = input

  if (result.userId !== userId) {
    return { ok: false, error: 'user_mismatch', detail: 'authenticated user does not match result.userId' }
  }

  const validated = validateDiagnosticResult(result)
  if (!validated.ok) {
    return {
      ok: false,
      error: 'invalid_result',
      detail: validated.issues.map((i) => i.detail).join('; '),
    }
  }

  const { error } = await supabase.from('pronunciation_assessments').insert({
    id,
    user_id: userId,
    schema_version: schemaVersion,
    // Cast: `result` is a validated PronunciationDiagnosticResult (a plain
    // JSON-serializable object per its Zod schema), but the generated
    // Supabase `Json` type can't structurally unify with a hand-written
    // interface — this is a data shape assertion, not an `any` escape hatch.
    result: validated.result as unknown as Database['public']['Tables']['pronunciation_assessments']['Insert']['result'],
    completed_at: result.completedAt,
  })

  if (error) {
    if (error.code === UNIQUE_VIOLATION_CODE) {
      // Same client-generated id already persisted — idempotent retry.
      return { ok: true, alreadyPersisted: true }
    }
    return { ok: false, error: 'db_error', detail: error.message }
  }

  return { ok: true, alreadyPersisted: false }
}
