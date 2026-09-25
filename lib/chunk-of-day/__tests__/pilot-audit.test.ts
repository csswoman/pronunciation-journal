import { describe, expect, it } from 'vitest'
import { LEARNING_CHUNKS } from '../catalog'
import { assessPlannedChunkMix, auditA1ChunkPilot, observedChunkActionShare, pilotCoverageReport, plannedChunkMixReport } from '../pilot-audit'

describe('auditoría del piloto A1', () => {
  it('requiere 25–40 chunks A1 con anclas y respuesta de práctica', () => {
    const pilot = LEARNING_CHUNKS.filter((chunk) => chunk.learning.cefr === 'A1' && chunk.contentGraph.anchors.length > 0)
    const audit = auditA1ChunkPilot(pilot)
    expect(audit).toMatchObject({
      chunkCount: 36,
      a1ChunkCount: 36,
      linkedChunkCount: 36,
      dialogueReadyChunkCount: 36,
      ipaReadyChunkCount: 36,
      issues: [],
    })
  })

  it('reports planned chunk share without presenting it as mastery', () => {
    const plan = {
      steps: [], totalExercises: 0, isNewUser: true,
      contentMix: { chunkActions: 7, wordOrSoundActions: 3, otherActions: 2 },
    }
    expect(observedChunkActionShare(plan)).toBe(0.7)
    expect(assessPlannedChunkMix(plan)).toEqual({
      targetShare: 0.7,
      chunkActionShare: 0.7,
      status: 'on_target',
    })
  })

  it('flags only aggregate calibration signals below the target', () => {
    expect(assessPlannedChunkMix({
      steps: [], totalExercises: 0, isNewUser: true,
      contentMix: { chunkActions: 2, wordOrSoundActions: 3, otherActions: 0 },
    }).status).toBe('below_target')
    expect(assessPlannedChunkMix({ steps: [], totalExercises: 0, isNewUser: true }).status).toBe('not_applicable')
  })

  it('separates planned novelty, review and exercise modes for editorial calibration', () => {
    const report = plannedChunkMixReport({
      totalExercises: 3,
      isNewUser: true,
      steps: [
        {
          kind: 'chunk_intro', id: 'intro', title: '', subtitle: '', icon: '', estMinutes: 1,
          chunks: [{} as never],
          exercises: [{ slug: 'multiple_choice' }, { slug: 'spoken_production' }] as never,
        },
        {
          kind: 'chunk_review', id: 'review', title: '', subtitle: '', icon: '', estMinutes: 1,
          chunks: [{} as never],
          exercises: [{ slug: 'fill_blank' }] as never,
        },
      ],
    })
    expect(report).toEqual({
      newChunkActions: 3,
      reviewChunkActions: 2,
      exercisesByMode: { multiple_choice: 1, spoken_production: 1, fill_blank: 1 },
    })
  })

  it('reports thin communicative and situational groups for editorial review', () => {
    const report = pilotCoverageReport(LEARNING_CHUNKS.slice(0, 25))
    expect(Object.values(report.chunksByCommunicativeFunction).reduce((total, count) => total + count, 0)).toBe(25)
    expect(Object.values(report.chunksBySituationCategory).reduce((total, count) => total + count, 0)).toBe(25)
    expect(report.thinCommunicativeFunctions).toContain('ask_help')
    expect(report.thinSituationCategories).toEqual([])
  })
})
