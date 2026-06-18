import { generateFillBlankFromWordBank } from '@/lib/exercises/generators/fill-blank'
import {
  generateCsDictation,
  loadConnectedSpeechDeck,
  type CsDeckSlug,
} from '@/lib/exercises/generators/connected-speech'
import {
  fetchFragmentsForDeck,
  fetchTextFragments,
  generateReorderFromFragments,
} from '@/lib/exercises/generators/reorder-from-fragments'
import { generateReorderWordsFromWordBank } from '@/lib/exercises/generators/reorder-words'
import { generateSentenceDictationFromWordBank } from '@/lib/exercises/generators/sentence-dictation'
import type { ExerciseSourceRef, GenericExercise, SentenceDictationExercise } from '@/lib/exercises/types'
import { exerciseId } from '@/lib/exercises/utils'
import { fromGenericExercise } from '@/lib/practice/adapters'
import { dedupeByContentId } from '@/lib/practice/daily-plan/selectors'
import type { DailyStep, PracticeContext, PracticeExercise } from '@/lib/practice/types'
import {
  connectedSpeechDeckTitle,
  isUuid,
  parseContentRef,
} from '@/lib/review/content-ref'
import type { FailedSentenceItem } from '@/lib/review/types'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'
import { getWordBankEntriesByIds } from '@/lib/word-bank/queries'
import type { WordBankEntry } from '@/lib/word-bank/types'

function makeDictation(
  sentence: string,
  contentId: string,
  sourceRef: ExerciseSourceRef,
): SentenceDictationExercise {
  return {
    id: exerciseId('sentence_dictation', contentId, sentence),
    type: 'sentence_dictation',
    sourceRef,
    sentence,
    audioUrl: null,
  }
}

async function fetchFragmentById(id: string) {
  const supabase = getSupabaseBrowserClient()
  const { data } = await supabase
    .from('text_fragments')
    .select('id, content, source, title')
    .eq('id', id)
    .maybeSingle()
  return data
}

function exerciseFromWordBank(
  word: WordBankEntry,
  slug: string,
): GenericExercise | null {
  if (slug === 'fill_blank') {
    const { exercises } = generateFillBlankFromWordBank([word], 1)
    if (exercises[0]) return exercises[0]
  }
  if (slug === 'reorder_words') {
    const exercises = generateReorderWordsFromWordBank([word], 1)
    if (exercises[0]) return exercises[0]
  }
  const dictations = generateSentenceDictationFromWordBank([word], 1)
  if (dictations[0]) return dictations[0]
  const reorders = generateReorderWordsFromWordBank([word], 1)
  return reorders[0] ?? null
}

async function exerciseFromTextFragment(
  item: FailedSentenceItem,
  ref: { source: string; id: string },
): Promise<GenericExercise | null> {
  const fragId = ref.id
  const sourceRef: ExerciseSourceRef = { source: 'text_fragments', id: fragId }

  if (connectedSpeechDeckTitle(fragId)) {
    if (item.phrase) return makeDictation(item.phrase, item.contentId, sourceRef)
    const deck = await loadConnectedSpeechDeck(fragId as CsDeckSlug)
    if (!deck) return null
    const exercises = generateCsDictation(deck, fragId, 1)
    return exercises[0] ?? null
  }

  if (isUuid(fragId)) {
    const fragment = await fetchFragmentById(fragId)
    if (!fragment) return item.phrase ? makeDictation(item.phrase, item.contentId, sourceRef) : null

    if (item.slug === 'reorder_words') {
      const exercises = generateReorderFromFragments([fragment], 1)
      if (exercises[0]) return exercises[0]
    }
    return makeDictation(fragment.content, item.contentId, { source: 'text_fragments', id: fragment.id })
  }

  if (fragId.startsWith('grammar-deck:')) {
    const deckSlug = fragId.slice('grammar-deck:'.length)
    const fragments = await fetchFragmentsForDeck(deckSlug, 20)
    if (item.slug === 'reorder_words' && fragments.length > 0) {
      const exercises = generateReorderFromFragments(fragments, 1)
      if (exercises[0]) return exercises[0]
    }
    if (item.phrase) return makeDictation(item.phrase, item.contentId, sourceRef)
    const first = fragments[0]
    if (first) {
      return makeDictation(first.content, item.contentId, { source: 'text_fragments', id: first.id })
    }
    return null
  }

  if (fragId.startsWith('lesson:')) {
    const fragments = await fetchTextFragments(fragId, 20)
    if (item.slug === 'reorder_words' && fragments.length > 0) {
      const exercises = generateReorderFromFragments(fragments, 1)
      if (exercises[0]) return exercises[0]
    }
    if (item.phrase) return makeDictation(item.phrase, item.contentId, sourceRef)
    const first = fragments[0]
    if (first) {
      return makeDictation(first.content, item.contentId, { source: 'text_fragments', id: first.id })
    }
  }

  if (item.phrase) return makeDictation(item.phrase, item.contentId, sourceRef)
  return null
}

/** Build one generic exercise mirroring the original failed drill type. */
export async function buildGenericExerciseForFailedItem(
  item: FailedSentenceItem,
  word?: WordBankEntry,
): Promise<GenericExercise | null> {
  if (word) return exerciseFromWordBank(word, item.slug)

  const ref = parseContentRef(item.contentId)
  if (ref?.source === 'text_fragments') {
    return exerciseFromTextFragment(item, ref)
  }

  if (item.phrase) {
    return makeDictation(item.phrase, item.contentId, {
      source: 'text_fragments',
      id: ref?.id ?? item.contentId,
    })
  }

  return null
}

export async function buildFailedExerciseForItem(
  item: FailedSentenceItem,
  word?: WordBankEntry,
  context: PracticeContext = 'review',
): Promise<PracticeExercise | null> {
  const generic = await buildGenericExerciseForFailedItem(item, word)
  if (!generic) return null
  return fromGenericExercise(generic, context)
}

export async function buildFailedSentencesMixStep(
  items: FailedSentenceItem[],
  context: PracticeContext = 'review',
): Promise<DailyStep | null> {
  const drillable = items.filter((item) => item.drillable)
  if (drillable.length === 0) return null

  const wordIds = drillable.map((item) => item.wordBankId).filter((id): id is string => id != null)
  const words = await getWordBankEntriesByIds(wordIds)
  const wordMap = new Map(words.map((w) => [w.id, w]))

  const exercises: PracticeExercise[] = []
  for (const item of drillable) {
    const word = item.wordBankId ? wordMap.get(item.wordBankId) : undefined
    const exercise = await buildFailedExerciseForItem(item, word, context)
    if (exercise) exercises.push(exercise)
  }

  const deduped = dedupeByContentId(exercises)
  if (deduped.length === 0) return null

  return {
    kind: 'word_review',
    id: 'failed_sentences',
    title: 'Frases falladas',
    subtitle: `${deduped.length} ${deduped.length === 1 ? 'oración' : 'oraciones'} para reforzar`,
    icon: 'FileWarning',
    exercises: deduped,
    estMinutes: Math.max(2, Math.round(deduped.length * 1.2)),
  }
}

/** Single-item drill from the review hub. */
export async function buildFailedItemStep(
  item: FailedSentenceItem,
  context: PracticeContext = 'review',
): Promise<DailyStep | null> {
  if (!item.drillable) return null

  const word = item.wordBankId
    ? (await getWordBankEntriesByIds([item.wordBankId]))[0]
    : undefined
  const exercise = await buildFailedExerciseForItem(item, word, context)
  if (!exercise) return null

  return {
    kind: 'word_review',
    id: `failed_sentence:${item.contentId}`,
    title: 'Frase fallada',
    subtitle: item.label,
    icon: 'FileWarning',
    exercises: [exercise],
    estMinutes: 2,
  }
}
