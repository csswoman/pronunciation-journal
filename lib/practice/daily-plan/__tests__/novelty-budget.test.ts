import { describe, expect, it } from 'vitest'
import { candidate, selectDailyCandidates } from '../policy'
import { reasonForStep } from '../candidate-helpers'
import { MAX_DUE_STEPS, RESERVED_CHUNK_NEW_SLOTS } from '../constants'
import { chunkPoolForLevel } from '@/lib/chunk-of-day/queries'
import type { LearningChunk } from '@/lib/chunk-of-day/types'
import type { DailySelectionReason, DailyStep } from '@/lib/practice/types'

function step(id: string, reason: DailySelectionReason, target = id): ReturnType<typeof candidate> {
  const value = {
    id, kind: 'concept', title: id, subtitle: '', icon: 'book', exercises: [], estMinutes: 1,
  } as DailyStep
  return candidate(value, { reason, targetRefs: [target], source: 'test' })
}

function chunk(id: string, cefr: LearningChunk['learning']['cefr']): LearningChunk {
  return { id, learning: { cefr } } as LearningChunk
}

describe('daily novelty budget', () => {
  it('caps due steps so a review backlog cannot fill the whole session', () => {
    // El motivo del cambio: con 5 repasos pendientes la sesión era 100% repaso
    // y el alumno nunca veía material nuevo.
    const selected = selectDailyCandidates([
      step('due-1', 'due'), step('due-2', 'due'), step('due-3', 'due'),
      step('due-4', 'due'), step('due-5', 'due'),
      step('chunk', 'chunk_new'), step('word', 'word_new'), step('variety', 'variety'),
    ], { limit: 5, reservedChunkNewSlots: RESERVED_CHUNK_NEW_SLOTS, maxDueSteps: MAX_DUE_STEPS })

    expect(selected.filter((entry) => entry.selection?.reason === 'due')).toHaveLength(MAX_DUE_STEPS)
    expect(selected.map((entry) => entry.id)).toContain('chunk')
    expect(selected.map((entry) => entry.id)).toContain('word')
  })

  it('lets new words claim a reserved slot when no new chunk is left', () => {
    // El pool de chunks del nivel se agota; la novedad no debe desaparecer.
    const selected = selectDailyCandidates([
      step('due-1', 'due'), step('due-2', 'due'),
      step('word-1', 'word_new'), step('variety', 'variety'),
    ], { limit: 3, reservedChunkNewSlots: 2, maxDueSteps: MAX_DUE_STEPS })

    expect(selected.map((entry) => entry.id)).toContain('word-1')
  })

  it('gives new chunks the reserved slots before new words', () => {
    const selected = selectDailyCandidates([
      step('word', 'word_new'), step('chunk', 'chunk_new'), step('due', 'due'),
    ], { limit: 2, reservedChunkNewSlots: 1, maxDueSteps: MAX_DUE_STEPS })

    expect(selected.map((entry) => entry.id)).toEqual(['due', 'chunk'])
  })

  it('classifies word_intro as new material, not filler', () => {
    const wordIntro = { kind: 'word_intro', id: 'word_intro' } as DailyStep
    const reason = reasonForStep(wordIntro, {
      hasDueSrs: true, hasProgress: true, hasSavedOrFamiliar: true,
    })
    expect(reason).toBe('word_new')
  })
})

describe('chunkPoolForLevel', () => {
  const catalog = [chunk('a1-1', 'A1'), chunk('a1-2', 'A1'), chunk('a2-1', 'A2'), chunk('b1-1', 'B1')]

  it('stays at the learner level while unseen chunks remain', () => {
    const pool = chunkPoolForLevel(catalog, 'A1', new Set(['a1-1']))
    expect(pool.map((entry) => entry.id)).toEqual(['a1-1', 'a1-2'])
  })

  it('widens to the next level once the current one is exhausted', () => {
    // Sin esto el plan se quedaba sin material nuevo en silencio.
    const pool = chunkPoolForLevel(catalog, 'A1', new Set(['a1-1', 'a1-2']))
    expect(pool.map((entry) => entry.id)).toContain('a2-1')
  })

  it('keeps widening when several levels are exhausted', () => {
    const pool = chunkPoolForLevel(catalog, 'A1', new Set(['a1-1', 'a1-2', 'a2-1']))
    expect(pool.map((entry) => entry.id)).toContain('b1-1')
  })
})
