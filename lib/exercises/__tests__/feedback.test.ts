import { describe, expect, it } from 'vitest'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import type {
  FillBlankExercise,
  MatchPairsExercise,
  MultipleChoiceExercise,
  ReorderWordsExercise,
  SentenceDictationExercise,
} from '@/lib/exercises/types'

const sourceRef = { source: 'words' as const, id: 'word-1' }

describe('buildPedagogicalFeedback', () => {
  it('includes expected answer and example for wrong fill blank answers', () => {
    const exercise: FillBlankExercise = {
      id: 'fb-1',
      type: 'fill_blank',
      sourceRef,
      sentence: 'She ___ coffee every morning.',
      answer: 'drinks',
      options: ['drink', 'drinks'],
      hint: 'Third-person singular needs -s.',
    }
    const feedback = buildPedagogicalFeedback(exercise, false, 'drink')
    expect(feedback.expectedAnswer).toBe('drinks')
    expect(feedback.example).toBe('She drinks coffee every morning.')
    expect(feedback.canRetry).toBe(true)
    expect(feedback.errorCode).toBe('meaning_choice')
  })

  it('uses multiple choice explanations', () => {
    const exercise: MultipleChoiceExercise = {
      id: 'mc-1',
      type: 'multiple_choice',
      sourceRef,
      question: 'Choose the correct verb.',
      options: ['go', 'goes'],
      answerIndex: 1,
      explanation: 'She takes goes in the present simple.',
    }
    const feedback = buildPedagogicalFeedback(exercise, false, 'go')
    expect(feedback.explanation).toBe('She takes goes in the present simple.')
    expect(feedback.expectedAnswer).toBe('goes')
    expect(feedback.errorCode).toBe('meaning_choice')
  })

  it('includes correct order for wrong reorder answers', () => {
    const exercise: ReorderWordsExercise = {
      id: 'rw-1',
      type: 'reorder_words',
      sourceRef,
      sentence: 'I am learning English.',
      tokens: ['English.', 'I', 'learning', 'am'],
    }
    const feedback = buildPedagogicalFeedback(exercise, false, 'I learning am English.')
    expect(feedback.expectedAnswer).toBe('I am learning English.')
    expect(feedback.category).toBe('reorder_word_order')
    expect(feedback.errorCode).toBe('word_order')
  })

  it('uses the full sentence for dictation feedback', () => {
    const exercise: SentenceDictationExercise = {
      id: 'dict-1',
      type: 'sentence_dictation',
      sourceRef,
      sentence: 'They live near the station.',
      audioUrl: null,
    }
    const feedback = buildPedagogicalFeedback(exercise, false, 'They leave near station')
    expect(feedback.expectedAnswer).toBe('They live near the station.')
    expect(feedback.explanation).toContain('sounds and written words')
    expect(feedback.errorCode).toBe('listening_omission')
  })

  it('keeps correct answers concise', () => {
    const exercise: ReorderWordsExercise = {
      id: 'rw-2',
      type: 'reorder_words',
      sourceRef,
      sentence: 'We study at night.',
      tokens: ['We', 'study', 'at', 'night.'],
    }
    const feedback = buildPedagogicalFeedback(exercise, true, 'We study at night.')
    expect(feedback.immediate).toBe('Good order.')
    expect(feedback.explanation).toBeUndefined()
    expect(feedback.canRetry).toBe(false)
    expect(feedback.errorCode).toBe('correct')
  })

  it('marks empty fill blank answers', () => {
    const exercise: FillBlankExercise = {
      id: 'fb-empty',
      type: 'fill_blank',
      sourceRef,
      sentence: 'She ___ coffee.',
      answer: 'drinks',
      options: ['drink', 'drinks'],
    }
    expect(buildPedagogicalFeedback(exercise, false, ' ').errorCode).toBe('empty_answer')
  })

  it('marks common fill blank inflection errors', () => {
    const exercise: FillBlankExercise = {
      id: 'fb-form',
      type: 'fill_blank',
      sourceRef,
      sentence: 'They ___ every day.',
      answer: 'work',
      options: ['work', 'works'],
    }
    expect(buildPedagogicalFeedback(exercise, false, 'works').errorCode).toBe('form_error')
  })

  it('marks pair mapping errors', () => {
    const exercise: MatchPairsExercise = {
      id: 'pairs-1',
      type: 'match_pairs',
      sourceRef,
      pairs: [{ id: 'cat-gato', left: 'cat', right: 'gato' }],
    }
    expect(buildPedagogicalFeedback(exercise, false, 'cat=perro').errorCode).toBe('pair_mapping')
  })
})
