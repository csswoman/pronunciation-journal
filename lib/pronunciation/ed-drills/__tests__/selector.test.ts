import { describe, expect, it } from 'vitest'
import { ED_DRILL_CATALOG } from '../catalog'
import { MASTERY_ACCURACY, selectNextItem } from '../selector'
import type { EdCluster, UserEdClusterProgress } from '../types'

function progress(cluster: EdCluster, accuracy: number): UserEdClusterProgress {
  return {
    id: `user:${cluster}`,
    userId: 'user',
    cluster,
    allophone: cluster.endsWith('id') ? 'id' : cluster === 'kt' || cluster === 'pt' || cluster === 'st' ? 't' : 'd',
    attemptsCount: 5,
    accuracy,
    unlockedLevel: 1,
    epenthesisWarningsCount: 0,
    lastPracticedAt: '2026-09-13T00:00:00.000Z',
  }
}

describe('selectNextItem', () => {
  it('descarta clusters dominados', () => {
    const catalog = ED_DRILL_CATALOG.filter((item) => item.cluster === 'vd' || item.cluster === 'zd')
    const result = selectNextItem(catalog, new Map([['vd', progress('vd', MASTERY_ACCURACY)]]))

    expect(result?.cluster).toBe('zd')
  })

  it('prioriza el cluster practicado con menor accuracy', () => {
    const catalog = ED_DRILL_CATALOG.filter((item) => item.cluster === 'vd' || item.cluster === 'zd' || item.cluster === 'kt')
    const result = selectNextItem(catalog, new Map([
      ['vd', progress('vd', 0.7)],
      ['zd', progress('zd', 0.4)],
      ['kt', progress('kt', 0.6)],
    ]))

    expect(result?.cluster).toBe('zd')
  })

  it('prioriza un cluster sin progreso sobre uno ya practicado', () => {
    const catalog = ED_DRILL_CATALOG.filter((item) => item.cluster === 'vd' || item.cluster === 'zd')
    const result = selectNextItem(catalog, new Map([['vd', progress('vd', 0.1)]]))

    expect(result?.cluster).toBe('zd')
  })

  it('devuelve null cuando todo el catálogo está dominado', () => {
    const progressByCluster = new Map<EdCluster, UserEdClusterProgress>(
      [...new Set(ED_DRILL_CATALOG.map((item) => item.cluster))].map((cluster) => [
        cluster,
        progress(cluster, MASTERY_ACCURACY),
      ]),
    )

    expect(selectNextItem(ED_DRILL_CATALOG, progressByCluster)).toBeNull()
  })
})
