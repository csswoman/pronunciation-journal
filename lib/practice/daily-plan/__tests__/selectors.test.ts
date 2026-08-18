import { describe, expect, it } from 'vitest'
import { dedupeByContentId, getSemanticContentKey } from '../selectors'
import type { PracticeExercise } from '@/lib/practice/types'

describe('getSemanticContentKey', () => {
  it('handles phoneme exercises', () => {
    const ex: PracticeExercise = {
      id: 'ex1',
      slug: 'minimal_pair',
      exerciseTypeId: 3,
      contentId: '1:minimal_pair:ship:sheep',
      context: 'daily',
      payload: {
        kind: 'phoneme',
        ipa: 'ɪ',
        targetWord: 'ship',
        options: [
          { id: 'ship', label: 'ship', isCorrect: true },
          { id: 'sheep', label: 'sheep', isCorrect: false },
        ],
        correctIds: ['ship'],
        stimuli: [],
      },
    }
    expect(getSemanticContentKey(ex)).toBe('phoneme:minimal_pair:ship')
  })

  it('handles generic sentence exercises', () => {
    const ex: PracticeExercise = {
      id: 'ex2',
      slug: 'fill_blank',
      exerciseTypeId: 2,
      contentId: 'db_id_1',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'fb_1',
          type: 'fill_blank',
          sentence: 'This is a ___ example.',
          answer: 'good',
          options: ['good', 'bad'],
          sourceRef: { source: 'word_bank', id: 'db_id_1' },
        },
      },
    }
    expect(getSemanticContentKey(ex)).toBe('generic:thisisagoodexample')
  })

  it('normalizes spaces, casing and punctuation', () => {
    const ex: PracticeExercise = {
      id: 'ex3',
      slug: 'sentence_dictation',
      exerciseTypeId: 3,
      contentId: 'db_id_2',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'sd_1',
          type: 'sentence_dictation',
          sentence: 'This   is, a   good example!',
          audioUrl: null,
          sourceRef: { source: 'word_bank', id: 'db_id_2' },
        },
      },
    }
    expect(getSemanticContentKey(ex)).toBe('generic:thisisagoodexample')
  })

  it('handles match_pairs sorting', () => {
    const ex: PracticeExercise = {
      id: 'ex4',
      slug: 'match_pairs',
      exerciseTypeId: 4,
      contentId: 'db_id_3',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'mp_1',
          type: 'match_pairs',
          pairs: [
            { id: '1', left: 'hello', right: 'hola' },
            { id: '2', left: 'bye', right: 'adios' },
          ],
        },
      },
    }
    expect(getSemanticContentKey(ex)).toBe('match_pairs:bye:adios,hello:hola')
  })
})

describe('dedupeByContentId', () => {
  it('deduplicates based on semantic key, not database id', () => {
    const ex1: PracticeExercise = {
      id: 'ex1',
      slug: 'fill_blank',
      exerciseTypeId: 2,
      contentId: 'db_id_1',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'fb_1',
          type: 'fill_blank',
          sentence: 'It was an ___ moment.',
          answer: 'ephemeral',
          options: ['ephemeral', 'permanent'],
          sourceRef: { source: 'word_bank', id: 'db_id_1' },
        },
      },
    }

    const ex2: PracticeExercise = {
      id: 'ex2',
      slug: 'sentence_context',
      exerciseTypeId: 5,
      contentId: 'db_id_2',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'sc_1',
          type: 'sentence_context',
          sentence: 'It was an ___ moment.',
          fullSentence: 'It was an ephemeral moment.',
          answer: 'ephemeral',
          definition: 'lasting a very short time',
          options: [{ id: '1', word: 'ephemeral' }],
        },
      },
    }

    const ex3: PracticeExercise = {
      id: 'ex3',
      slug: 'fill_blank',
      exerciseTypeId: 2,
      contentId: 'db_id_3',
      context: 'daily',
      payload: {
        kind: 'generic',
        data: {
          id: 'fb_2',
          type: 'fill_blank',
          sentence: 'Another completely different sentence.',
          answer: 'hello',
          options: ['hello'],
          sourceRef: { source: 'word_bank', id: 'db_id_3' },
        },
      },
    }

    const deduped = dedupeByContentId([ex1, ex2, ex3])
    expect(deduped).toHaveLength(2)
    expect(deduped[0].id).toBe(ex1.id)
    expect(deduped[1].id).toBe(ex3.id)
  })
})
