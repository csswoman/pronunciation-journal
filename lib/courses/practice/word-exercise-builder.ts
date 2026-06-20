import type { CoreWord } from '@/lib/core-1000/types'
import { core1000WordId } from '@/lib/core-1000/types'
import type { FillBlankExercise, SentenceDictationExercise, GenericExercise } from '@/lib/exercises/types'
import { blankWord, exerciseId, pick, shuffle } from '@/lib/exercises/utils'

const FILL_BLANK_OPTIONS = 4

/**
 * Converts CoreWord[] into GenericExercise[].
 * Each word becomes a fill_blank using its example_sentence.
 * sourceRef.source = 'core1k' so the progress dispatcher can route to gradeCore1000Word.
 */
export function buildWordExercises(words: CoreWord[]): GenericExercise[] {
  if (words.length === 0) return []

  // Pool of distractor words — all target words except self
  const allTargets = words.map((w) => w.word)

  return words.flatMap((word): GenericExercise[] => {
    const wordId = core1000WordId(word.word)
    const blanked = blankWord(word.example_sentence, word.word)

    if (blanked) {
      const availableDistracters = allTargets.filter(
        (t) => t.toLowerCase() !== word.word.toLowerCase(),
      )
      const distractors = pick(availableDistracters, FILL_BLANK_OPTIONS - 1)

      // Fall back to dictation if not enough distractors
      if (distractors.length < FILL_BLANK_OPTIONS - 1) {
        return [buildDictation(word, wordId)]
      }

      const ex: FillBlankExercise = {
        id: exerciseId('fill_blank', wordId, word.word),
        type: 'fill_blank',
        exerciseType: { domain: 'vocabulary', mode: 'fill_blank', variant: 'sentence' },
        sourceRef: { source: 'core1k', id: wordId },
        sentence: blanked,
        answer: word.word,
        options: shuffle([word.word, ...distractors]),
        hints: {
          level1: `Empieza con "${word.word.charAt(0).toUpperCase()}"`,
          level2: `La palabra es: ${word.word}`,
        },
      }
      return [ex]
    }

    return [buildDictation(word, wordId)]
  })
}

function buildDictation(word: CoreWord, wordId: string): SentenceDictationExercise {
  return {
    id: exerciseId('sentence_dictation', wordId, word.example_sentence),
    type: 'sentence_dictation',
    exerciseType: { domain: 'vocabulary', mode: 'sentence_dictation' },
    sourceRef: { source: 'core1k', id: wordId },
    sentence: word.example_sentence,
    audioUrl: null,
    targetWord: word.word,
  }
}
