import type { WordEntry } from '@/lib/lexicon/types'
import type { SentenceContextExercise, SentenceContextOption } from '@/lib/exercises/types'
import { blankLemma, hasEnoughContext } from '@/lib/exercises/eligibility'
import { exerciseId, pick, shuffle } from '@/lib/exercises/utils'
import { VOCABULARY_TOPIC } from '@/lib/practice/topic-labels'

const MAX_SENTENCE_CONTEXT = 4
const OPTIONS_COUNT = 4

/**
 * Generate sentence_context exercises from a pool of WordEntry.
 *
 * For each word that has a non-empty exampleSentence and whose word appears
 * in that sentence, generate one exercise. Distractors are drawn first from
 * the session pool (same-session words), then from same-tag neighbours if
 * needed. The correct word is never used as a distractor.
 *
 * `word.id` is a lexicon content id, not a `word_bank` UUID — the two
 * namespaces are not interchangeable. When `resolveBankId` maps a word to a
 * real bank row, the exercise carries a `word_bank` sourceRef using that UUID
 * so SRS updates land on the correct row. Otherwise no sourceRef is emitted:
 * the exercise still records answer evidence but does not update any bank row.
 *
 * Returns at most MAX_SENTENCE_CONTEXT exercises.
 */
export function generateSentenceContextExercises(
  candidateWords: WordEntry[],
  sessionPool: WordEntry[],
  resolveBankId?: (contentId: string) => string | undefined,
): SentenceContextExercise[] {
  const usable = candidateWords.filter((w) => {
    if (!w.exampleSentence) return false
    const blanked = blankLemma(w.exampleSentence, w.word)
    return blanked !== null && hasEnoughContext(blanked)
  })
  const selected = pick(usable, MAX_SENTENCE_CONTEXT)

  return selected.map((word) => {
    const blanked = blankLemma(word.exampleSentence!, word.word)!
    const distractors = pickDistractors(word, sessionPool)
    const options: SentenceContextOption[] = shuffle([
      { id: word.id, word: word.word },
      ...distractors,
    ])

    const bankId = resolveBankId?.(word.id)

    return {
      id: exerciseId('sentence_context', word.id, 'v1'),
      type: 'sentence_context',
      ...(bankId ? { sourceRef: { source: 'word_bank' as const, id: bankId } } : {}),
      topic: VOCABULARY_TOPIC,
      sentence: blanked,
      fullSentence: word.exampleSentence!,
      answer: word.word,
      definition: word.definition,
      options,
    }
  })
}

function pickDistractors(
  target: WordEntry,
  pool: WordEntry[],
): SentenceContextOption[] {
  const needed = OPTIONS_COUNT - 1
  const others = pool.filter((w) => w.id !== target.id)

  // Prefer words sharing a tag with the target (plausible distractors)
  const sameTag = others.filter((w) => w.tags.some((t) => target.tags.includes(t)))
  const candidates = sameTag.length >= needed ? sameTag : others

  return pick(candidates, needed).map((w) => ({ id: w.id, word: w.word }))
}
