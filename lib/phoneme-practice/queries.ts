import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  Sound,
  SoundWord,
  MinimalPair,
  UserContrastProgress,
  SessionAnswer,
  SRResult,
} from './types'

function supabase() {
  return getSupabaseBrowserClient()
}

let exerciseTypeCache: Record<string, number> | null = null

async function getExerciseTypeId(slug: string): Promise<number> {
  if (!exerciseTypeCache) {
    const { data, error } = await supabase().from('exercise_types').select('id, slug')
    if (error) throw error
    exerciseTypeCache = Object.fromEntries(data.map(r => [r.slug, r.id]))
  }
  const id = exerciseTypeCache[slug]
  if (id === undefined) throw new Error(`Unknown exercise type slug: ${slug}`)
  return id
}

export async function getAllSounds(): Promise<Sound[]> {
  const { data, error } = await supabase()
    .from('sounds')
    .select('*')
    .order('id')
  if (error) throw error
  return data as Sound[]
}

export async function getSoundById(soundId: number): Promise<Sound> {
  const { data, error } = await supabase()
    .from('sounds')
    .select('*')
    .eq('id', soundId)
    .single()
  if (error) throw error
  return data as Sound
}

export async function getWordsBySound(soundId: number): Promise<SoundWord[]> {
  const { data, error } = await supabase()
    .from('words')
    .select('*')
    .eq('sound_id', soundId)
  if (error) throw error
  return data as SoundWord[]
}

export async function getAllWords(): Promise<SoundWord[]> {
  const { data, error } = await supabase()
    .from('words')
    .select('*')
  if (error) throw error
  return data as SoundWord[]
}

export async function getMinimalPairs(soundId: number): Promise<MinimalPair[]> {
  const { data, error } = await supabase()
    .from('minimal_pairs')
    .select('*')
    .or(`contrast_sound_a_id.eq.${soundId},contrast_sound_b_id.eq.${soundId}`)
  if (error) throw error
  return data as MinimalPair[]
}

export async function saveAnswers(
  userId: string,
  answers: SessionAnswer[]
): Promise<void> {
  const rows = await Promise.all(answers.map(async a => ({
    user_id: userId,
    sound_id: a.soundId,
    exercise_type_id: await getExerciseTypeId(a.exerciseType),
    is_correct: a.isCorrect,
    user_answer: a.userAnswer,
    target_word: a.targetWord ?? null,
    time_ms: a.timeMs,
    exercise_payload: (a.exercisePayload ?? null) as import('@/lib/supabase/types').Json | null,
  })))
  const { error } = await supabase().from('answer_history').insert(rows)
  if (error) throw error
}

export async function getAnswerHistoryForSound(
  userId: string,
  soundId: number
): Promise<{ exercise_type: string; is_correct: boolean }[]> {
  const { data, error } = await supabase()
    .from('answer_history')
    .select('exercise_types(slug), is_correct')
    .eq('user_id', userId)
    .eq('sound_id', soundId)
  if (error) return []
  return data.map(r => ({
    exercise_type: (r.exercise_types as { slug: string } | null)?.slug ?? '',
    is_correct: r.is_correct,
  }))
}

// ─── Contrast progress ────────────────────────────────────────────────────────

export async function getAllContrastProgress(
  userId: string
): Promise<UserContrastProgress[]> {
  const { data, error } = await supabase()
    .from('user_contrast_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data as UserContrastProgress[]
}

export async function getContrastProgress(
  userId: string,
  contrastId: string
): Promise<UserContrastProgress | null> {
  const { data, error } = await supabase()
    .from('user_contrast_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('contrast_id', contrastId)
    .maybeSingle()
  if (error) throw error
  return data as UserContrastProgress | null
}

/** Upserts the contrast row after a session. */
export async function updateContrastProgress(
  userId: string,
  contrastId: string,
  sessionCorrect: number,
  sessionTotal: number,
  sr: SRResult
): Promise<void> {
  const current = await getContrastProgress(userId, contrastId)

  const newTotal   = (current?.total_attempts  ?? 0) + sessionTotal
  const newCorrect = (current?.correct_answers ?? 0) + sessionCorrect

  const { error } = await supabase()
    .from('user_contrast_progress')
    .upsert({
      user_id:         userId,
      contrast_id:     contrastId,
      total_attempts:  newTotal,
      correct_answers: newCorrect,
      streak:          sr.streak,
      ease_factor:     sr.ease_factor,
      interval_days:   sr.interval_days,
      last_seen:       new Date().toISOString(),
      next_review:     sr.next_review.toISOString(),
    }, { onConflict: 'user_id,contrast_id' })
  if (error) throw error
}

/**
 * Returns contrasts due for review today (next_review <= now or null),
 * ordered by urgency.
 */
export async function getContrastsForToday(
  userId: string
): Promise<UserContrastProgress[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase()
    .from('user_contrast_progress')
    .select('*')
    .eq('user_id', userId)
    .or(`next_review.lte.${now},next_review.is.null`)
    .order('next_review', { ascending: true })
    .limit(10)
  if (error) throw error
  return data as UserContrastProgress[]
}

