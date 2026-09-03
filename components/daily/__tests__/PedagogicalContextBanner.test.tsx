// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PedagogicalContextBanner } from '../PedagogicalContextBanner'
import type { SessionArc } from '@/lib/practice/types'

describe('PedagogicalContextBanner', () => {
  it('renders nothing if arc has no prescription or journal repairs', () => {
    const arc: SessionArc = {
      topicLabel: 'Past Simple',
      soundIpa: '/iː/',
      sessionWords: ['sheep', 'ship'],
      diagnosticPrescription: null,
      journalRepairs: null,
    }

    const { container } = render(<PedagogicalContextBanner arc={arc} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders diagnostic prescription badge when active', () => {
    const arc: SessionArc = {
      topicLabel: null,
      soundIpa: '/θ/',
      sessionWords: [],
      diagnosticPrescription: {
        soundIpa: '/θ/',
        dayIndex: 2,
        totalDays: 5,
        reason: 'Focus on think/sink',
      },
      journalRepairs: null,
    }

    render(<PedagogicalContextBanner arc={arc} />)
    expect(screen.getByText('Foco personalizado:')).toBeInTheDocument()
    expect(screen.getByText(/Diagnóstico día 2\/5: \/θ\//i)).toBeInTheDocument()
  })

  it('renders journal repairs badge when active', () => {
    const arc: SessionArc = {
      topicLabel: null,
      soundIpa: null,
      sessionWords: [],
      diagnosticPrescription: null,
      journalRepairs: {
        count: 2,
        patterns: ['tense_present_for_past', 'prep_in_at_on'],
      },
    }

    render(<PedagogicalContextBanner arc={arc} />)
    expect(screen.getByText('Foco personalizado:')).toBeInTheDocument()
    expect(screen.getByText(/Reparación de 2 errores del Journal/i)).toBeInTheDocument()
  })
})
