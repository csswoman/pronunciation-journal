// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { PathEvidenceBundle } from '@/lib/pronunciation/path/load-evidence'
import { PronunciationPathPage } from '../PronunciationPathPage'

const TH = contrastTargetId('/θ/', '/ð/')
const SCHWA = phonemeTargetId('/ə/')

afterEach(() => cleanup())

function emptyEvidence(overrides: Partial<PathEvidenceBundle> = {}): PathEvidenceBundle {
  return {
    completedContentKeys: new Set(),
    spokenAttempts: [],
    diagnosticPriorityIds: [],
    diagnosticByTargetId: new Map(),
    ...overrides,
  }
}

describe('PronunciationPathPage', () => {
  it('recommends the first stage-1 target when there is no diagnostic', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled />
    )
    const next = screen.getByRole('region', { name: /qué practicar ahora/i })
    expect(next).toHaveTextContent(/los dos sonidos th/i)
    expect(next).toHaveTextContent(/siguiente paso de la ruta/i)
  })

  it('prefers a diagnostic priority target', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence({ diagnosticPriorityIds: [SCHWA] })}
        copyEnabled
      />
    )
    const next = screen.getByRole('region', { name: /qué practicar ahora/i })
    expect(next).toHaveTextContent(/vocal relajada/i)
    expect(next).toHaveTextContent(/diagnóstico señaló/i)
  })

  it('uses neutral copy when the path copy flag is off', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled={false} />
    )
    expect(screen.getByText(/siguiente práctica/i)).toBeInTheDocument()
    expect(screen.queryByText(/diagnóstico señaló|prioridad|accuracy|nivel de pronunciación/i)).not.toBeInTheDocument()
  })

  it('selects the unit from ?target=', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialTargetId={TH}
        copyEnabled
      />
    )
    const unitRegion = screen.getByRole('region', { name: /unidad activa/i })
    expect(unitRegion).toHaveTextContent(/los dos sonidos th/i)
  })
})
