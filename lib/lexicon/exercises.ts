import type { WordEntry } from '@/lib/lexicon/types'
import type { SentenceContextExercise, SentenceContextOption } from '@/lib/exercises/types'
import { blankLemma, hasEnoughContext } from '@/lib/exercises/eligibility'
import { exerciseId, pick, shuffle } from '@/lib/exercises/utils'
import { VOCABULARY_TOPIC } from '@/lib/practice/topic-labels'

const MAX_SENTENCE_CONTEXT = 4
const OPTIONS_COUNT = 4

/**
 * Lexicon catalog entry plus optional resolved `word_bank` PK.
 * `id` stays the catalog/content id; `bankId` is the real UUID when saved.
 */
export type SentenceContextSourceWord = WordEntry & {
  bankId?: string | null
}

/**
 * Generate sentence_context exercises from a pool of WordEntry.
 *
 * For each word that has a non-empty exampleSentence and whose word appears
 * in that sentence, generate one exercise. Distractors are drawn first from
 * the session pool (same-session words), then from same-tag neighbours if
 * needed. The correct word is never used as a distractor.
 *
 * Returns at most MAX_SENTENCE_CONTEXT exercises.
 *
 * Identity (plan 062): `sourceRef` is `word_bank`+UUID when `bankId` is set;
 * otherwise `lexicon`+catalog id (answer evidence only, no bank SRS).
 */
export function generateSentenceContextExercises(
  candidateWords: SentenceContextSourceWord[],
  sessionPool: SentenceContextSourceWord[],
): SentenceContextExercise[] {
  const usable = candidateWords.filter((w) => {
    if (!w.exampleSentence) return false
    const blanked = blankLemma(w.exampleSentence, w.word)
    return blanked !== null && hasEnoughContext(blanked)
  })

  return pick(usable, MAX_SENTENCE_CONTEXT).flatMap((word) => {
    const blanked = blankLemma(word.exampleSentence!, word.word)!
    const distractors = pickDistractors(word, sessionPool)
    // A short pool would render 2–3 choices, making the answer guessable;
    // drop the item rather than ship an easier-than-intended question.
    if (distractors.length < OPTIONS_COUNT - 1) return []

    const options: SentenceContextOption[] = shuffle([
      { id: word.id, word: word.word },
      ...distractors,
    ])

    return [{
      id: exerciseId('sentence_context', word.id, 'v1'),
      type: 'sentence_context',
      sourceRef: word.bankId
        ? { source: 'word_bank', id: word.bankId }
        : { source: 'lexicon', id: word.id },
      topic: VOCABULARY_TOPIC,
      sentence: blanked,
      fullSentence: word.exampleSentence!,
      answer: word.word,
      definition: word.definition,
      options,
    }]
  })
}

function pickDistractors(
  target: SentenceContextSourceWord,
  pool: SentenceContextSourceWord[],
): SentenceContextOption[] {
  const needed = OPTIONS_COUNT - 1
  // Exclude by id *and* spelling: a different catalog entry sharing the
  // target's surface form would render as a second correct-looking answer.
  const answer = target.word.toLowerCase()
  const seen = new Set<string>([answer])
  const others = pool.filter((w) => {
    if (w.id === target.id) return false
    const key = w.word.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Prefer words sharing a tag with the target (plausible distractors),
  // then backfill from the rest of the pool so a thin same-tag set still
  // yields a full set of options.
  const sameTag = others.filter((w) => w.tags.some((t) => target.tags.includes(t)))
  const rest = others.filter((w) => !sameTag.includes(w))
  const candidates = [...pick(sameTag, needed), ...pick(rest, needed)]

  return candidates.slice(0, needed).map((w) => ({ id: w.id, word: w.word }))
}
