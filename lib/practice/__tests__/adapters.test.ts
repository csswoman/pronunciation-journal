import { describe, it, expect } from 'vitest'
import { fromMixedExercise, fromGenericExercise } from '../adapters'
import { buildSession } from '../engine'
import { EXERCISE_TYPE_IDS } from '../types'
import type { MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import type { Exercise } from '@/lib/phoneme-practice/types'
import type {
  FillBlankExercise,
  SentenceDictationExercise,
  MatchPairsExercise,
  ReorderWordsExercise,
} from '@/lib/exercises/types'

const phonemeData: Exercise = {
  type: 'pick_word',
  soundId: 42,
  ipa: 'iː',
  targetWord: 'seat',
  options: [
    { id: 'a', label: 'seat', isCorrect: true },
    { id: 'b', label: 'sit', isCorrect: false },
  ],
  correctIds: ['a'],
  level: 'B1',
}

const matchPairsData: MatchPairsExercise = {
  id: 'mp-1',
  type: 'match_pairs',
  sourceRef: { source: 'words', id: 'word-1' },
  level: 'A2',
  pairs: [
    { id: 'p1', left: 'seat', right: 'siːt' },
    { id: 'p2', left: 'sit', right: 'sɪt' },
  ],
}

describe('fromMixedExercise', () => {
  it('produces payload.kind="phoneme" for phoneme exercises', () => {
    const result = fromMixedExercise({ kind: 'phoneme', data: phonemeData }, 'sound_lab')
    expect(result.payload.kind).toBe('phoneme')
    expect(result.slug).toBe('pick_word')
    expect(result.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.pick_word)
    expect(result.contentId).toContain('42')
    expect(result.contentId).toContain('pick_word')
    expect(result.soundId).toBe(42)
    expect(result.context).toBe('sound_lab')
    if (result.payload.kind === 'phoneme') {
      expect(result.payload.ipa).toBe('iː')
      expect(result.payload.targetWord).toBe('seat')
      expect(result.payload.correctIds).toEqual(['a'])
    }
  })

  it('produces payload.kind="generic" for match_pairs', () => {
    const result = fromMixedExercise(
      { kind: 'match_pairs', data: matchPairsData },
      'sound_lab',
    )
    expect(result.payload.kind).toBe('generic')
    expect(result.slug).toBe('match_pairs')
    expect(result.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.match_pairs)
    expect(result.contentId).toBe('mp-1')
    expect(result.sourceRef).toEqual({ source: 'words', id: 'word-1' })
    if (result.payload.kind === 'generic') {
      expect(result.payload.data).toBe(matchPairsData)
    }
  })

  it('produces a deterministic id (same inputs → same output)', () => {
    const a = fromMixedExercise({ kind: 'phoneme', data: phonemeData }, 'sound_lab')
    const b = fromMixedExercise({ kind: 'phoneme', data: phonemeData }, 'sound_lab')
    expect(a.id).toBe(b.id)
  })

  it('produces different ids for different content', () => {
    const other: Exercise = { ...phonemeData, soundId: 99 }
    const a = fromMixedExercise({ kind: 'phoneme', data: phonemeData }, 'sound_lab')
    const b = fromMixedExercise({ kind: 'phoneme', data: other }, 'sound_lab')
    expect(a.id).not.toBe(b.id)
  })

  it('buildSession does not dedupe distinct phoneme exercises sharing soundId', () => {
    // Regression: previously contentId was `String(soundId)`, so buildSession
    // collapsed every phoneme exercise of the same sound into one. Now each
    // slug/targetWord/options combination produces a distinct contentId.
    const exercises = [
      fromMixedExercise(
        { kind: 'phoneme', data: { ...phonemeData, type: 'pick_word' } },
        'sound_lab',
      ),
      fromMixedExercise(
        { kind: 'phoneme', data: { ...phonemeData, type: 'pick_sound' } },
        'sound_lab',
      ),
      fromMixedExercise(
        { kind: 'phoneme', data: { ...phonemeData, type: 'minimal_pair' } },
        'sound_lab',
      ),
    ]
    const session = buildSession({
      context: 'sound_lab',
      exercises,
      sessionLength: 3,
      onSessionComplete: () => {},
    })
    expect(session).toHaveLength(3)
    expect(new Set(session.map((e) => e.slug)).size).toBe(3)
  })
})

describe('fromGenericExercise', () => {
  const sourceRef = { source: 'words' as const, id: 'w-1' }

  it('maps fill_blank → "fill_blank"', () => {
    const ex: FillBlankExercise = {
      id: 'fb-1', type: 'fill_blank', sourceRef,
      sentence: 'I ___ apples.', answer: 'eat', options: ['eat', 'ate'],
    }
    const r = fromGenericExercise(ex, 'courses')
    expect(r.slug).toBe('fill_blank')
    expect(r.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.fill_blank)
    expect(r.contentId).toBe('fb-1')
    expect(r.payload.kind).toBe('generic')
    expect(r.sourceRef).toBe(sourceRef)
  })

  it('maps sentence_dictation → "sentence_dictation"', () => {
    const ex: SentenceDictationExercise = {
      id: 'sd-1', type: 'sentence_dictation', sourceRef,
      sentence: 'Hello world.', audioUrl: null,
    }
    const r = fromGenericExercise(ex, 'practice')
    expect(r.slug).toBe('sentence_dictation')
    expect(r.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.sentence_dictation)
  })

  it('maps match_pairs → "match_pairs"', () => {
    const r = fromGenericExercise(matchPairsData, 'ai_coach')
    expect(r.slug).toBe('match_pairs')
    expect(r.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.match_pairs)
    expect(r.level).toBe('A2')
  })

  it('maps reorder_words → "reorder_words"', () => {
    const ex: ReorderWordsExercise = {
      id: 'rw-1', type: 'reorder_words', sourceRef,
      sentence: 'I like apples.', tokens: ['apples.', 'I', 'like'],
    }
    const r = fromGenericExercise(ex, 'practice')
    expect(r.slug).toBe('reorder_words')
    expect(r.exerciseTypeId).toBe(EXERCISE_TYPE_IDS.reorder_words)
  })

  it('produces a deterministic id', () => {
    const a = fromGenericExercise(matchPairsData, 'sound_lab')
    const b = fromGenericExercise(matchPairsData, 'sound_lab')
    expect(a.id).toBe(b.id)
  })
})
