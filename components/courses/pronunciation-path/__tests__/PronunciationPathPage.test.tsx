// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { PathEvidenceBundle } from '@/lib/pronunciation/path/load-evidence'
import { PronunciationPathPage } from '../PronunciationPathPage'

vi.mock('@/lib/pronunciation/path/load-evidence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pronunciation/path/load-evidence')>()
  return {
    ...actual,
    loadPathEvidence: vi.fn(() => new Promise<PathEvidenceBundle>(() => {})),
  }
})

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
    expect(screen.getByText(/qué toca ahora/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /practicar · 5 min/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar el par/i })).toBeInTheDocument()
  })

  it('prefers a diagnostic priority target', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence({ diagnosticPriorityIds: [SCHWA] })}
        copyEnabled
      />
    )
    expect(screen.getByRole('heading', { name: /vocal relajada/i })).toBeInTheDocument()
  })

  it('renders progress card with 19 segmented bars', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled />
    )
    expect(screen.getByText(/tu avance en la ruta/i)).toBeInTheDocument()
    expect(screen.getByText(/de 19 unidades/i)).toBeInTheDocument()
  })

  it('renders step navigation accessible with aria-pressed', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialStage="sentence-prosody"
        copyEnabled
      />
    )
    expect(
      screen.getByRole('navigation', { name: /etapas de la ruta/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /3\. ritmo y étnasis|3\. ritmo/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('shows a loading card with aria-busy while evidence hydrates', () => {
    render(<PronunciationPathPage copyEnabled />)
    const loading = screen.getByRole('region', { name: /cargando tu siguiente práctica/i })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByText(/qué toca ahora/i)).not.toBeInTheDocument()
  })

  it('renders units list in explore sidebar with titles', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled />
    )
    expect(screen.getByText(/unidades del paso 1 · sonidos/i)).toBeInTheDocument()
    expect(screen.getByText(/19 unidades en 5 pasos/i)).toBeInTheDocument()
  })

  it('renders step 3 sentence-prosody cleanly without raw string overlap', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialStage="sentence-prosody"
        copyEnabled
      />
    )
    expect(screen.getByText(/unidades del paso 3 · ritmo/i)).toBeInTheDocument()
    expect(screen.getAllByText(/las palabras fuertes de la frase/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/el ritmo de la frase/i)).toBeInTheDocument()
  })
})
