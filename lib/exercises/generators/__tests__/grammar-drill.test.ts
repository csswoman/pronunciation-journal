import { describe, it, expect } from 'vitest'
import { buildGrammarDrill } from '../grammar-drill'
import type { GrammarDrill } from '@/lib/courses/grammar-deck/drill-schema'

describe('buildGrammarDrill', () => {
  const sampleDrill: GrammarDrill = {
    level: 'A1',
    reviewed: true,
    transform: [
      { source: 'I am happy.', instruction: 'Usa contracción', accept: ["I'm happy."], contractions: 'require' },
    ],
    build: [
      { kind: 'reorder', accept: ['I am a student.'] },
    ],
    correct: [
      { sentence: 'I are from Mexico.', accept: ['{I am|I\'m} from Mexico.'], explanation: 'Con I se usa am.' },
    ],
    personalize: [
      { mode: 'frame', frame: "I'm ___ years old.", slot: 'number' },
    ],
  }

  it('builds exercises in the exact method order: transform -> build -> correct -> personalize', () => {
    const exercises = buildGrammarDrill('a1-verbo-to-be', sampleDrill)
    expect(exercises.length).toBe(4)

    expect(exercises[0].type).toBe('sentence_transformation')
    expect(exercises[1].type).toBe('reorder_words')
    expect(exercises[2].type).toBe('error_correction')
    expect(exercises[3].type).toBe('personalization')
  })

  it('assigns metadata and sourceRef uniformly', () => {
    const exercises = buildGrammarDrill('a1-verbo-to-be', sampleDrill)
    for (const ex of exercises) {
      expect(ex.level).toBe('A1')
      expect(ex.lessonSlug).toBe('a1-verbo-to-be')
      expect(ex.sourceRef).toEqual({
        source: 'grammar_deck',
        id: 'grammar-deck:a1-verbo-to-be',
      })
      expect(ex.id).toBeTruthy()
    }
  })

  it('maps combine builds to sentence_transformation', () => {
    const combineDrill: GrammarDrill = {
      level: 'B1',
      reviewed: true,
      build: [
        {
          kind: 'combine',
          sources: ['I was tired.', 'I went to bed.'],
          connector: 'so',
          accept: ['I was tired so I went to bed.'],
        },
      ],
    }
    const exercises = buildGrammarDrill('b1-conjunctions', combineDrill)
    expect(exercises.length).toBe(1)
    expect(exercises[0].type).toBe('sentence_transformation')
    const ex = exercises[0] as import('@/lib/exercises/types').SentenceTransformationExercise
    expect(ex.instruction).toBe('Une las oraciones usando so.')
    expect(ex.sourceSentence).toBe('I was tired. I went to bed.')
  })
})
