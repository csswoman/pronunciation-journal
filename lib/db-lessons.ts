import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export interface DbPattern {
  id: number
  pattern: string
  type: string | null
  sound_focus: string | null
}

export interface DbPatternWord {
  id: number
  pattern_id: number
  word: string
  ipa: string | null
}

export interface DbSound {
  id: number
  ipa: string
  type: 'vowel' | 'consonant' | 'diphthong'
  category: string | null
  example: string | null
  difficulty: number | null
}

export interface DbWord {
  id: number
  word: string
  ipa: string | null
  sound_id: number | null
  difficulty: number | null
  audio_url: string | null
  sound_focus: string | null
}

function supabase() {
  return getSupabaseBrowserClient()
}

export async function getAllPatterns(): Promise<DbPattern[]> {
  const { data, error } = await supabase()
    .from('patterns')
    .select('*')
    .order('id')
  if (error) throw error
  return data as DbPattern[]
}

/** Returns a map from IPA string to sound id, used to link patterns to practice pages */
export async function getSoundIdsByIpa(): Promise<Record<string, number>> {
  const { data, error } = await supabase().from('sounds').select('id, ipa')
  if (error) throw error
  return Object.fromEntries((data as { id: number; ipa: string }[]).map(s => [s.ipa, s.id]))
}

export async function getPatternWords(patternId: number): Promise<DbPatternWord[]> {
  const { data, error } = await supabase()
    .from('pattern_words')
    .select('*')
    .eq('pattern_id', patternId)
  if (error) throw error
  return data as DbPatternWord[]
}

export async function getAllPatternWordsGrouped(): Promise<Record<number, DbPatternWord[]>> {
  const { data, error } = await supabase()
    .from('pattern_words')
    .select('*')
  if (error) throw error
  const grouped: Record<number, DbPatternWord[]> = {}
  for (const row of data as DbPatternWord[]) {
    if (!grouped[row.pattern_id]) grouped[row.pattern_id] = []
    grouped[row.pattern_id].push(row)
  }
  return grouped
}

export async function getAllSoundsWithWords(): Promise<{ sound: DbSound; words: DbWord[] }[]> {
  const [soundsRes, wordsRes] = await Promise.all([
    supabase().from('sounds').select('*').order('id'),
    supabase().from('words').select('*'),
  ])
  if (soundsRes.error) throw soundsRes.error
  if (wordsRes.error) throw wordsRes.error

  const sounds = soundsRes.data as DbSound[]
  const words = wordsRes.data as DbWord[]

  const wordsBySound: Record<number, DbWord[]> = {}
  for (const word of words) {
    if (word.sound_id == null) continue
    if (!wordsBySound[word.sound_id]) wordsBySound[word.sound_id] = []
    wordsBySound[word.sound_id].push(word)
  }

  return sounds
    .filter((s) => (wordsBySound[s.id]?.length ?? 0) >= 3)
    .map((s) => ({ sound: s, words: wordsBySound[s.id] }))
}
