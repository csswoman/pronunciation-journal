import { describe, expect, it } from 'vitest'
import { getLearningChunk, LEARNING_CHUNKS } from '../catalog'
import { routePronunciationDifficulty } from '../pronunciation-routing'
import { buildPronunciationRouteExercises } from '../queries'

/**
 * Suite de verificación para el grafo de contenido en niveles intermedios (A2 y B1).
 * Verifica que:
 * 1. Chunks A2 y B1 resuelven correctamente anclas y resaltados en contentGraph.
 * 2. routePronunciationDifficulty sobre palabras ancla de A2/B1 devuelve rutas con ejercicios válidos en lugar de null.
 */
describe('intermediate content graph bridge (A2 and B1)', () => {
  it('resolves content graph anchors and highlights for A2 and B1 chunks', () => {
    const chunkA2 = getLearningChunk('094-no-problem-at-all')
    expect(chunkA2).toBeDefined()
    expect(chunkA2?.learning.cefr).toBe('A2')
    expect(chunkA2?.contentGraph.anchors).toEqual([
      { owner: 'essential_words', id: 'c1k:problem' },
    ])
    expect(chunkA2?.contentGraph.highlights).toHaveLength(1)
    expect(chunkA2?.contentGraph.text).toBe(chunkA2?.chunk)

    const chunkB1 = getLearningChunk('048-that-s-a-good-point')
    expect(chunkB1).toBeDefined()
    expect(chunkB1?.learning.cefr).toBe('B1')
    expect(chunkB1?.contentGraph.anchors).toEqual([
      { owner: 'essential_words', id: 'c1k:point' },
    ])
    expect(chunkB1?.contentGraph.highlights).toHaveLength(1)
    expect(chunkB1?.contentGraph.text).toBe(chunkB1?.chunk)
  })

  it('routes pronunciation difficulty on A2 word anchor to valid exercises instead of null', () => {
    const route = routePronunciationDifficulty('c1k:problem', LEARNING_CHUNKS)
    expect(route).not.toBeNull()
    expect(route?.chunks.map((c) => c.id)).toContain('094-no-problem-at-all')
    expect(route?.pronunciationTargetIds).toContain('segmental.phoneme./ɹ/')

    const exercises = buildPronunciationRouteExercises(route!.chunks, route!.pronunciationTargetIds, 'A2')
    expect(exercises.length).toBeGreaterThan(0)
    expect(exercises[0]).toMatchObject({
      slug: 'cs_shadow_phrase',
      sourceRef: { source: 'chunks', id: '094-no-problem-at-all' },
    })
  })

  it('routes pronunciation difficulty on B1 word anchor to valid chunks and exercises', () => {
    const route = routePronunciationDifficulty('c1k:point', LEARNING_CHUNKS)
    expect(route).not.toBeNull()
    expect(route?.chunks.map((c) => c.id)).toContain('048-that-s-a-good-point')

    const exercises = buildPronunciationRouteExercises(route!.chunks, route!.pronunciationTargetIds, 'B1')
    expect(exercises.length).toBeGreaterThan(0)
  })

  it('resolves newly expanded intermediate communicative chunks', () => {
    const thinkA2 = getLearningChunk('068-i-don-t-think-so')
    expect(thinkA2).toBeDefined()
    expect(thinkA2?.learning.cefr).toBe('A2')
    expect(thinkA2?.contentGraph.anchors).toEqual([{ owner: 'essential_words', id: 'c1k:think' }])
    expect(thinkA2?.contentGraph.pronunciationTargetIds).toContain('segmental.contrast./ð/|/θ/')

    const weatherB1 = getLearningChunk('016-nice-weather-we-re-having-isn-t-it')
    expect(weatherB1).toBeDefined()
    expect(weatherB1?.learning.cefr).toBe('B1')
    expect(weatherB1?.contentGraph.anchors).toEqual([{ owner: 'essential_words', id: 'c1k:weather' }])
    expect(weatherB1?.contentGraph.pronunciationTargetIds).toContain('segmental.contrast./ð/|/θ/')

    const route = routePronunciationDifficulty('c1k:weather', LEARNING_CHUNKS)
    expect(route).not.toBeNull()
    expect(route?.chunks.map((c) => c.id)).toContain('016-nice-weather-we-re-having-isn-t-it')
  })
})

