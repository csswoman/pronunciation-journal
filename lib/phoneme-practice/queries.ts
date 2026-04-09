import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import type {
  Sound,
  SoundWord,
  MinimalPair,
  UserSoundProgressWithSound,
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

export async function getAllProgress(userId: string): Promise<UserSoundProgressWithSound[]> {
  const { data, error } = await supabase()
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', userId)
    .order('sound_id')
  if (error) throw error
  return data as unknown as UserSoundProgressWithSound[]
}

export async function getSoundsForToday(userId: string): Promise<UserSoundProgressWithSound[]> {
  const now = new Date().toISOString()
  const { data, error } = await supabase()
    .from('user_sound_progress')
    .select('*, sounds(*)')
    .eq('user_id', userId)
    .neq('status', 'locked')
    .or(`next_review.lte.${now},next_review.is.null`)
    .order('next_review', { ascending: true })
    .limit(5)
  if (error) throw error
  return data as unknown as UserSoundProgressWithSound[]
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

export async function updateProgress(
  userId: string,
  soundId: number,
  sessionCorrect: number,
  sessionTotal: number,
  sr: SRResult
): Promise<void> {
  const { data: current, error: fetchErr } = await supabase()
    .from('user_sound_progress')
    .select('total_attempts, correct_answers, best_streak, status')
    .eq('user_id', userId)
    .eq('sound_id', soundId)
    .maybeSingle()
  if (fetchErr) throw fetchErr

  const newTotal = (current?.total_attempts ?? 0) + sessionTotal
  const newCorrect = (current?.correct_answers ?? 0) + sessionCorrect
  const newBestStreak = Math.max(current?.best_streak ?? 0, sr.streak)
  const accuracy = newTotal > 0 ? newCorrect / newTotal : 0
  const currentStatus = current?.status ?? 'available'
  const status = currentStatus === 'mastered'
    ? 'mastered'
    : accuracy >= 0.5 ? 'practicing' : 'available'

  const { error } = await supabase()
    .from('user_sound_progress')
    .upsert({
      user_id: userId,
      sound_id: soundId,
      total_attempts: newTotal,
      correct_answers: newCorrect,
      streak: sr.streak,
      best_streak: newBestStreak,
      ease_factor: sr.ease_factor,
      interval_days: sr.interval_days,
      last_practiced: new Date().toISOString(),
      next_review: sr.next_review.toISOString(),
      status,
    }, { onConflict: 'user_id,sound_id' })
  if (error) throw error
}

export async function markMastered(userId: string, soundId: number): Promise<void> {
  const { error } = await supabase()
    .from('user_sound_progress')
    .update({ status: 'mastered' })
    .eq('user_id', userId)
    .eq('sound_id', soundId)
  if (error) throw error
}

export async function unlockNextSound(userId: string, nextSoundId: number): Promise<void> {
  const { error } = await supabase()
    .from('user_sound_progress')
    .update({ status: 'available' })
    .eq('user_id', userId)
    .eq('sound_id', nextSoundId)
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
