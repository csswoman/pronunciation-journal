import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type { WordBankEntry } from '@/lib/types'

function supabase() {
  return getSupabaseBrowserClient()
}

export interface TextFragment {
  id: string
  title: string
  content: string
  audio_url: string | null
  created_at: string
}

/** Fetch word_bank entries with status='ready' that have enough data for exercises. */
export async function getWordBankForExercises(): Promise<WordBankEntry[]> {
  const { data, error } = await supabase()
    .from('word_bank')
    .select('*')
    .eq('status', 'ready')
    .not('example', 'is', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as WordBankEntry[]
}

/** Fetch text fragments for the current user. */
export async function getTextFragmentsForExercises(): Promise<TextFragment[]> {
  const { data, error } = await supabase()
    .from('text_fragments')
    .select('id, title, content, audio_url, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as TextFragment[]
}

/** Record a generic exercise answer in answer_history. */
export async function saveGenericAnswer(opts: {
  userId: string
  exerciseTypeSlug: string
  isCorrect: boolean
  userAnswer: string
  targetWord: string
  timeMs: number
  exercisePayload: Record<string, unknown>
}): Promise<void> {
  // Resolve exercise_type_id
  const { data: typeRows, error: typeError } = await supabase()
    .from('exercise_types')
    .select('id')
    .eq('slug', opts.exerciseTypeSlug)
    .single()

  if (typeError) throw typeError

  const payload = opts.exercisePayload as import('@/lib/supabase/types').Json

  const { error } = await supabase().from('answer_history').insert({
    user_id: opts.userId,
    is_correct: opts.isCorrect,
    user_answer: opts.userAnswer,
    target_word: opts.targetWord,
    time_ms: opts.timeMs,
    exercise_type_id: typeRows.id,
    exercise_payload: payload,
    // sound_id is nullable — omit for generic exercises
  })

  if (error) throw error
}
