import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createEmptyState, type UserLearningState } from '@/lib/ai-practice/learning-state'
import type { JournalFeedback, JournalCorrectionResult } from './correction'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'

export interface PersistJournalCorrectionInput {
  userId: string
  entryId: string
  correction: JournalCorrectionResult
  feedback: JournalFeedback
  patterns: ErrorPatternId[]
}

export async function persistJournalCorrection(
  supabase: SupabaseClient<Database>,
  input: PersistJournalCorrectionInput,
): Promise<{ applied: boolean; state: UserLearningState | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Supabase types predate the journal RPC migration.
  const { data, error } = await supabase.rpc('apply_journal_correction' as any, {
    p_user_id: input.userId,
    p_entry_id: input.entryId,
    p_corrected_content: input.correction.correctedContent,
    p_feedback: input.feedback,
    p_pattern_ids: input.patterns,
    p_initial_state: createEmptyState(input.userId, 'server') as unknown as Record<string, unknown>,
  })

  if (error) throw error
  const result = data as unknown as { applied?: boolean; state?: UserLearningState | null } | null
  if (typeof result?.applied !== 'boolean') throw new Error('Journal correction RPC returned an invalid result')
  return { applied: result.applied, state: result.state ?? null }
}
