import { describe, expect, it } from 'vitest'
import { LEARNING_CHUNKS } from '../catalog'
import { routePronunciationDifficulty } from '../pronunciation-routing'
import { buildPronunciationRouteExercises } from '../queries'
import { buildContrastDiscriminationExercise } from '../queries'

describe('enrutamiento de dificultad de pronunciación', () => {
  it('propone solo chunks enlazados de forma autoral a la palabra difícil', () => {
    const source = LEARNING_CHUNKS.find((chunk) => chunk.contentGraph.anchors.length > 0)!
    const wordId = source.contentGraph.anchors[0].id
    const route = routePronunciationDifficulty(wordId, LEARNING_CHUNKS)
    expect(route?.chunks).toContainEqual(source)
    expect(route?.chunks.every((chunk) => chunk.contentGraph.anchors.some((anchor) => anchor.id === wordId))).toBe(true)
  })

  it('does not invent a route for an unlinked word', () => {
    expect(routePronunciationDifficulty('c1k:unlinked', LEARNING_CHUNKS)).toBeNull()
  })

  it('bridges only the legacy Essential Word namespace used by the daily fallback', () => {
    const route = routePronunciationDifficulty('core1k:where', LEARNING_CHUNKS)
    expect(route?.wordId).toBe('core1k:where')
    expect(route?.chunks.map((chunk) => chunk.id)).toContain('013-where-are-you-from')
    expect(routePronunciationDifficulty('word:where', LEARNING_CHUNKS)).toBeNull()
  })

  it('uses the listen-and-shadow fallback only for a registered authored target', () => {
    const route = routePronunciationDifficulty('c1k:where', LEARNING_CHUNKS)
    expect(route).not.toBeNull()
    const exercises = buildPronunciationRouteExercises(route!.chunks.slice(0, 1), route!.pronunciationTargetIds, 'A1')
    expect(exercises[0]).toMatchObject({ slug: 'cs_shadow_phrase', sourceRef: { source: 'chunks' } })
    expect(exercises.map((exercise) => exercise.slug)).not.toContain('spoken_production')
  })

  it('uses a real minimal-pair dataset for a registered contrast before shadowing', () => {
    const exercise = buildContrastDiscriminationExercise(
      ['segmental.contrast./ð/|/θ/'],
      [{ id: 1, ipa: '/θ/', example: null, category: null, type: null, difficulty: null }],
      [{
        id: 1, word_a: 'thin', word_b: 'then', ipa_a: '/θɪn/', ipa_b: '/ðɛn/', sound_group: null,
        contrast_ipa_a: '/θ/', contrast_ipa_b: '/ð/', contrast_sound_a_id: 1, contrast_sound_b_id: 2,
      }],
    )
    expect(exercise).toMatchObject({ slug: 'minimal_pair', contrastId: '/ð/|/θ/' })
  })

  it('routes pronunciation difficulty for A2 and B1 chunk anchors with registered targets', () => {
    const a2Route = routePronunciationDifficulty('c1k:problem', LEARNING_CHUNKS)
    expect(a2Route).not.toBeNull()
    expect(a2Route?.chunks.map((c) => c.id)).toContain('094-no-problem-at-all')
    expect(a2Route?.pronunciationTargetIds).toContain('segmental.phoneme./ɹ/')

    const b1Route = routePronunciationDifficulty('c1k:point', LEARNING_CHUNKS)
    expect(b1Route).not.toBeNull()
    expect(b1Route?.chunks.map((c) => c.id)).toContain('048-that-s-a-good-point')
  })
})
