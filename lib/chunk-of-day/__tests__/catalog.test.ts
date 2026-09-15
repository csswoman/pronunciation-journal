import { describe, expect, it } from 'vitest'
import { CHUNKS_OF_THE_DAY } from '../data'
import { LEARNING_CHUNKS } from '../catalog'
import { validateChunkContentGraph } from '../content-graph'
import type { ChunkContentGraphEntry } from '../types'
import { buildChunkExercises } from '../exercises'

const PLACEHOLDER = /\{([a-z][a-z0-9_]*)\}/g
const CEFR = new Set(['A1', 'A2', 'B1', 'B2', 'C1'])
const REGISTERS = new Set(['neutral', 'informal', 'formal'])
const PATTERNS = new Set(['fixed', 'semi_fixed', 'frame'])

function normalize(text: string): string {
  return text.toLowerCase().replace(/[’'ʼ]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

describe('chunk learning catalog', () => {
  it('has one metadata record for every canonical chunk', () => {
    expect(LEARNING_CHUNKS).toHaveLength(CHUNKS_OF_THE_DAY.length)
    expect(new Set(LEARNING_CHUNKS.map((chunk) => chunk.id)).size).toBe(CHUNKS_OF_THE_DAY.length)
  })

  it('keeps templates and slots internally consistent', () => {
    for (const chunk of LEARNING_CHUNKS) {
      expect(CEFR.has(chunk.learning.cefr)).toBe(true)
      expect(REGISTERS.has(chunk.learning.register)).toBe(true)
      expect(PATTERNS.has(chunk.learning.patternType)).toBe(true)
      const placeholders = [...(chunk.learning.template ?? '').matchAll(PLACEHOLDER)].map((match) => match[1])
      expect(new Set(placeholders)).toEqual(new Set(chunk.learning.slots.map((slot) => slot.id)))
      if (chunk.learning.patternType === 'fixed') {
        expect(chunk.learning.template).toBeNull()
        expect(chunk.learning.slots).toEqual([])
      }
      expect(chunk.learning.acceptedAnswers.every((answer) => normalize(answer) !== normalize(chunk.learning.coreText))).toBe(true)
      expect(chunk.learning.practiceAnswer.trim()).not.toBe('')
      expect(chunk.learning.recognitionCueEs.trim()).not.toBe('')
      expect(chunk.learning.productionCueEs.trim()).not.toBe('')
    }
  })

  it('builds a progressive session attributed to chunks', () => {
    const selected = LEARNING_CHUNKS.slice(0, 2)
    const exercises = buildChunkExercises(selected, LEARNING_CHUNKS, 'practice')
    // One form↔meaning board opens the session and covers both chunks at once,
    // so the learner meets today's expressions before being asked to recall them.
    expect(exercises.map((exercise) => exercise.slug)).toEqual([
      'match_pairs',
      'multiple_choice', 'reorder_words', 'translation_es_en', 'sentence_dictation', 'written_production', 'spoken_production',
      'multiple_choice', 'reorder_words', 'translation_es_en', 'sentence_dictation',
    ])
    // Every attributable exercise names its chunk. match_pairs is the sole
    // exception by design: it grades one group answer, so crediting it to any
    // single chunk's SRS would corrupt that chunk's schedule.
    expect(exercises.filter((exercise) => exercise.slug !== 'match_pairs')
      .every((exercise) => exercise.sourceRef?.source === 'chunks')).toBe(true)
    expect(exercises.find((exercise) => exercise.slug === 'match_pairs')?.sourceRef).toBeUndefined()
  })

  it('keeps every authored bridge structurally valid', () => {
    expect(LEARNING_CHUNKS.filter((chunk) => chunk.contentGraph.anchors.length > 0)).toHaveLength(36)
    for (const chunk of LEARNING_CHUNKS) {
      expect(chunk.contentGraph.text).toBe(chunk.chunk)
      expect(chunk.contentGraph.highlights).toHaveLength(chunk.contentGraph.anchors.length)
    }
  })

  it('rejects an invalid graph entry before it can reach the UI', () => {
    const bad: ChunkContentGraphEntry = {
      chunkId: CHUNKS_OF_THE_DAY[0]!.id,
      markedText: '**Different text**',
      anchors: [{ owner: 'essential_words', id: 'word-without-prefix' }],
      pronunciationTargetIds: ['missing.target'],
    }
    expect(validateChunkContentGraph(CHUNKS_OF_THE_DAY, [bad]).map((issue) => issue.code)).toEqual([
      'text_mismatch', 'invalid_anchor', 'unknown_pronunciation_target',
    ])
  })
})
