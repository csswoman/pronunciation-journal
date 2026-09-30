import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'
import { createEmptyState, type UserLearningState } from '@/lib/ai-practice/learning-state'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getWordsDueForReview } from '@/lib/word-bank/server-queries'
import type { JournalFeedback, JournalCorrectionResult } from './correction'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'
import type { DueReviewSeedWord, GrammarNote, ResolvedSeedWord, SeedWord, SelectedGrammarNote } from './scaffold-resolver'

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

const normalize = (value: string) => value.trim().toLowerCase()

export async function resolveSeedVocabulary(seedVocabulary: SeedWord[], userId: string): Promise<ResolvedSeedWord[]> {
  if (!seedVocabulary.length) return []
  const supabase = await createSupabaseServerClient()
  const candidateTexts = [...new Set(seedVocabulary.flatMap(({ text }) => {
    const trimmed = text.trim()
    return [text, trimmed, trimmed.toLowerCase(), trimmed.toUpperCase()]
  }))]
  const { data, error } = await supabase
    .from('word_bank')
    .select('id, text, translation, ipa, example, srs_status')
    .eq('user_id', userId)
    .in('text', candidateTexts)
  if (error) throw error
  const byText = new Map((data ?? []).map((row) => [normalize(row.text), row]))
  return seedVocabulary.map((seed) => {
    const own = byText.get(normalize(seed.text))
    return own
      ? { id: own.id, text: seed.text, translation: own.translation ?? seed.translation, ipa: own.ipa ?? seed.ipa, example: own.example ?? seed.example, inWordBank: true, srsStatus: own.srs_status, provenance: 'scaffold' }
      : { ...seed, inWordBank: false, srsStatus: null, provenance: 'scaffold' }
  })
}

/** Adapts the canonical personal word-bank review queue for optional journal suggestions. */
export async function fetchDueWordsForScaffold(userId: string, limit: number): Promise<DueReviewSeedWord[]> {
  const words = await getWordsDueForReview(userId, limit)
  return words.map((word) => ({
    id: word.id,
    text: word.text,
    translation: word.translation ?? word.meaning ?? '',
    ipa: word.ipa ?? '',
    example: word.example ?? '',
    inWordBank: true,
    srsStatus: word.srs_status,
    provenance: 'dueReview',
  }))
}

export async function selectGrammarNote(relevantTopics: string[], grammarNotes: GrammarNote[], userId: string): Promise<SelectedGrammarNote | null> {
  if (!relevantTopics.length || !grammarNotes.length) return null
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.from('topic_srs').select('topic, next_review_at').eq('user_id', userId).in('topic', relevantTopics)
  if (error) throw error
  const now = Date.now()
  const rows = data ?? []
  const due = rows.filter((row) => row.next_review_at && new Date(row.next_review_at).getTime() <= now).sort((a, b) => (a.next_review_at ?? '').localeCompare(b.next_review_at ?? ''))[0]
  const scheduled = rows.filter((row) => row.next_review_at).sort((a, b) => (a.next_review_at ?? '').localeCompare(b.next_review_at ?? ''))[0]
  const chosen = due ?? scheduled
  const topicId = chosen?.topic ?? relevantTopics[0]
  const note = grammarNotes.find((item) => item.topic_id === topicId) ?? grammarNotes[0]
  if (!note) return null
  return { topicId: note.topic_id, rule: note.rule, exampleCorrect: note.example_correct, exampleWrong: note.example_wrong, dueState: due ? 'due' : scheduled ? 'scheduled' : 'unseen', nextReviewAt: chosen?.next_review_at ?? null }
}
