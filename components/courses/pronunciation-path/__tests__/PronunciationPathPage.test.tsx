// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { contrastTargetId, phonemeTargetId } from '@/lib/pronunciation/targets/registry'
import type { PathEvidenceBundle } from '@/lib/pronunciation/path/load-evidence'
import { PronunciationPathPage } from '../PronunciationPathPage'

vi.mock('@/lib/pronunciation/path/load-evidence', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/pronunciation/path/load-evidence')>()
  return {
    ...actual,
    loadPathEvidence: vi.fn(() => new Promise<PathEvidenceBundle>(() => {})),
  }
})

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
    expect(next).toHaveTextContent(/siguiente paso:/i)
    expect(within(next).getByRole('link', { name: /practicar en sound lab/i })).toBeInTheDocument()
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
    expect(next).toHaveTextContent(/según tu diagnóstico/i)
  })

  it('uses neutral copy when the path copy flag is off', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled={false} />
    )
    expect(screen.getByRole('region', { name: /^siguiente práctica$/i })).toBeInTheDocument()
    expect(screen.queryByText(/según tu diagnóstico|prioridad|accuracy|nivel de pronunciación/i)).not.toBeInTheDocument()
  })

  it('keeps a single focus card when recommendation matches the active unit', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialTargetId={TH}
        copyEnabled
      />
    )
    const next = screen.getByRole('region', { name: /qué practicar ahora/i })
    expect(next).toHaveTextContent(/los dos sonidos th/i)
    expect(screen.queryByRole('region', { name: /unidad activa/i })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /practicar en sound lab/i })).toHaveLength(1)
  })

  it('shows explore detail when ?stage= diverges from the recommendation', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialStage="intonation-transfer"
        copyEnabled
      />
    )
    const unitRegion = screen.getByRole('region', { name: /unidad activa/i })
    expect(unitRegion).toHaveTextContent(/pregunta|entonación|rising|sube/i)
    expect(within(unitRegion).getByRole('link', { name: /volver a/i })).toBeInTheDocument()
    expect(within(unitRegion).queryByText(/unidad seleccionada/i)).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: /tu siguiente práctica/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^5\.\s*entonación$/i })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('keeps a single primary practice CTA when recommendation matches the active unit', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled />
    )
    expect(screen.getAllByRole('link', { name: /practicar en sound lab/i })).toHaveLength(1)
  })

  it('shows a loading card with aria-busy while evidence hydrates', () => {
    render(<PronunciationPathPage copyEnabled />)
    const loading = screen.getByRole('region', { name: /cargando tu siguiente práctica/i })
    expect(loading).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('region', { name: /qué practicar ahora/i })).not.toBeInTheDocument()
  })

  it('localizes explore unit states in Spanish', () => {
    render(
      <PronunciationPathPage evidenceOverride={emptyEvidence()} copyEnabled />
    )
    const explore = screen.getByText(/ver todas las unidades/i).closest('details')
    expect(explore).toBeTruthy()
    explore!.setAttribute('open', '')
    expect(within(explore as HTMLElement).getAllByText(/sin empezar/i).length).toBeGreaterThan(0)
    expect(within(explore as HTMLElement).queryByText('not_started')).not.toBeInTheDocument()
  })

  it('keeps stage nav accessible without a visible legend', () => {
    render(
      <PronunciationPathPage
        evidenceOverride={emptyEvidence()}
        initialStage="intonation-transfer"
        copyEnabled
      />
    )
    expect(
      screen.getByRole('navigation', { name: /etapas de la ruta/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/^etapas$/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/borde:\s*siguiente práctica/i)).not.toBeInTheDocument()
  })
})
