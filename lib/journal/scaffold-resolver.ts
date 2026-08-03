import 'server-only'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type SeedWord = { text: string; translation: string; ipa: string; example: string }
export type GrammarNote = {
  topic_id: string
  rule: string
  example_correct: string
  example_wrong: string
}
export type ResolvedSeedWord = SeedWord & { inWordBank: boolean; srsStatus: string | null }
export type SelectedGrammarNote = { topicId: string; rule: string; exampleCorrect: string; exampleWrong: string; dueState: 'due' | 'scheduled' | 'unseen'; nextReviewAt: string | null }

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
    .select('text, translation, ipa, example, srs_status')
    .eq('user_id', userId)
    .in('text', candidateTexts)
  if (error) throw error
  const byText = new Map((data ?? []).map((row) => [normalize(row.text), row]))
  return seedVocabulary.map((seed) => {
    const own = byText.get(normalize(seed.text))
    return own ? { text: seed.text, translation: own.translation ?? seed.translation, ipa: own.ipa ?? seed.ipa, example: own.example ?? seed.example, inWordBank: true, srsStatus: own.srs_status } : { ...seed, inWordBank: false, srsStatus: null }
  })
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
