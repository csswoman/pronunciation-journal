import { describe, expect, it } from 'vitest'
import {
  ED_DRILL_EVIDENCE_ACCURACY,
  ED_DRILL_EVIDENCE_MIN_ATTEMPTS,
  findEdClusterEvidence,
} from '../ed-drill-step'
import type { EdCluster } from '@/lib/pronunciation/ed-drills/types'

type Row = { cluster: EdCluster; accuracy: number; attemptsCount: number }

const progress = (...rows: Row[]) =>
  new Map<EdCluster, Row>(rows.map((row) => [row.cluster, row]))

describe('findEdClusterEvidence', () => {
  it('devuelve null sin progreso alguno (usuario nuevo: el paso no aparece)', () => {
    expect(findEdClusterEvidence(progress())).toBeNull()
  })

  it('ignora un cluster con un solo intento: un resbalón no es evidencia', () => {
    const found = findEdClusterEvidence(progress({ cluster: 'vd', accuracy: 0.1, attemptsCount: 1 }))
    expect(found).toBeNull()
  })

  it('ignora clusters ya dominados', () => {
    const found = findEdClusterEvidence(progress({ cluster: 'vd', accuracy: 0.95, attemptsCount: 8 }))
    expect(found).toBeNull()
  })

  it('detecta un cluster con accuracy baja y suficientes intentos', () => {
    const found = findEdClusterEvidence(progress({ cluster: 'zd', accuracy: 0.5, attemptsCount: 4 }))
    expect(found).toEqual({ cluster: 'zd', accuracy: 0.5, attemptsCount: 4 })
  })

  it('elige el peor cluster cuando hay varios con evidencia', () => {
    const found = findEdClusterEvidence(
      progress(
        { cluster: 'vd', accuracy: 0.7, attemptsCount: 5 },
        { cluster: 'kt', accuracy: 0.3, attemptsCount: 5 },
        { cluster: 'zd', accuracy: 0.6, attemptsCount: 5 },
      ),
    )
    expect(found?.cluster).toBe('kt')
  })

  it('trata el umbral como estricto: justo en el límite no es evidencia', () => {
    const atThreshold = findEdClusterEvidence(
      progress({ cluster: 'vd', accuracy: ED_DRILL_EVIDENCE_ACCURACY, attemptsCount: 5 }),
    )
    expect(atThreshold).toBeNull()
  })

  it('acepta exactamente el mínimo de intentos', () => {
    const found = findEdClusterEvidence(
      progress({ cluster: 'vd', accuracy: 0.4, attemptsCount: ED_DRILL_EVIDENCE_MIN_ATTEMPTS }),
    )
    expect(found?.cluster).toBe('vd')
  })
})
