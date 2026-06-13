import { getSupabaseBrowserClient } from '@/lib/supabase/client'

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

export async function getAllSoundsWithWords(): Promise<{ sound: DbSound; words: DbWord[] }[]> {
  const [soundsRes, wordsRes] = await Promise.all([
    supabase().from('sounds').select('id, ipa, type, category, example, difficulty').order('id'),
    supabase().from('words').select('id, word, ipa, sound_id, difficulty, audio_url, sound_focus'),
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
