import { describe, expect, it } from 'vitest'
import { chunkCefrSupport } from '../cefr-ladder'
import { buildChunkExercises } from '../exercises'
import { LEARNING_CHUNKS } from '../catalog'

describe('andamiaje CEFR de chunks', () => {
  it('permite escucha con cloze y habla formulaica desde A1 sin dictado completo', () => {
    expect(chunkCefrSupport('A1')).toMatchObject({
      allowFullDictation: false,
      visibleModel: true,
      responseFreedom: 'formulaic',
    })
    expect(chunkCefrSupport('A1').stages).toContain('cloze')
  })

  it('aumenta recuperación y libertad de respuesta gradualmente', () => {
    expect(chunkCefrSupport('A2').responseFreedom).toBe('substitution')
    expect(chunkCefrSupport('B1')).toMatchObject({ allowFullDictation: false, responseFreedom: 'guided' })
    expect(chunkCefrSupport('C1').responseFreedom).toBe('open')
  })

  it('introduces cloze before full dictation', () => {
    const chunks = LEARNING_CHUNKS.slice(0, 1)
    expect(buildChunkExercises(chunks, LEARNING_CHUNKS, 'practice', 'A1').map((entry) => entry.slug))
      .toContain('fill_blank')
    expect(buildChunkExercises(chunks, LEARNING_CHUNKS, 'practice', 'A2').map((entry) => entry.slug))
      .toContain('fill_blank')
    expect(buildChunkExercises(chunks, LEARNING_CHUNKS, 'practice', 'B1').map((entry) => entry.slug))
      .toContain('fill_blank')
    expect(buildChunkExercises(chunks, LEARNING_CHUNKS, 'practice', 'B1').map((entry) => entry.slug))
      .not.toContain('sentence_dictation')
    expect(buildChunkExercises(chunks, LEARNING_CHUNKS, 'practice', 'B2').map((entry) => entry.slug))
      .toContain('sentence_dictation')
  })

  it('adds an audio model to chunk recognition while keeping a valid text fallback', () => {
    const exercise = buildChunkExercises(LEARNING_CHUNKS.slice(0, 1), LEARNING_CHUNKS, 'practice', 'A1')[0]!
    expect(exercise.payload).toMatchObject({ kind: 'generic', data: { type: 'multiple_choice', audioText: LEARNING_CHUNKS[0]!.chunk } })
    expect(buildChunkExercises(LEARNING_CHUNKS.slice(0, 1), LEARNING_CHUNKS, 'practice', 'A1')[1]!.payload)
      .toMatchObject({ kind: 'generic', data: { type: 'fill_blank', audioText: LEARNING_CHUNKS[0]!.learning.practiceAnswer } })
  })

  it('uses authored slots for substitution and introduces reconstruction from B1', () => {
    const withSlot = LEARNING_CHUNKS.find((chunk) => chunk.learning.slots.length > 0)!
    expect(buildChunkExercises([withSlot], LEARNING_CHUNKS, 'practice', 'A2').map((entry) => entry.slug))
      .toContain('sentence_transformation')
    expect(buildChunkExercises(LEARNING_CHUNKS.slice(0, 1), LEARNING_CHUNKS, 'practice', 'B1').map((entry) => entry.slug))
      .toContain('reorder_words')
  })

  it('introduces a contextual dialogue turn only from B1', () => {
    const chunkWithDialogue = LEARNING_CHUNKS.find((chunk) => chunk.example_dialogue?.some((turn) =>
      turn.en.toLowerCase().includes(chunk.learning.coreText.toLowerCase()),
    ))!
    expect(buildChunkExercises([chunkWithDialogue], LEARNING_CHUNKS, 'practice', 'A2').map((entry) => entry.slug))
      .not.toContain('translation_es_en')
    expect(buildChunkExercises([chunkWithDialogue], LEARNING_CHUNKS, 'practice', 'B1').map((entry) => entry.slug))
      .toContain('translation_es_en')
  })

  it('removes the model-copy shortcut for guided and open production', () => {
    const chunk = LEARNING_CHUNKS[0]!
    const productionPromptFor = (level: 'A1' | 'B1' | 'B2') => buildChunkExercises([chunk], LEARNING_CHUNKS, 'practice', level)
      .find((entry) => entry.slug === 'written_production')!.payload

    expect(productionPromptFor('A1')).toMatchObject({
      kind: 'generic', data: { taskPrompt: chunk.learning.productionCueEs },
    })
    expect(productionPromptFor('B1')).toMatchObject({
      kind: 'generic', data: { taskPrompt: expect.stringMatching(/no copies la oración modelo/) },
    })
    expect(productionPromptFor('B2')).toMatchObject({
      kind: 'generic', data: { taskPrompt: expect.stringMatching(/matiz o detalle natural/) },
    })
  })
})
