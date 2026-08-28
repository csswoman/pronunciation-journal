// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SyllableRemediation } from '../SyllableRemediation'
import type { SyllableRemediation as RemediationData } from '@/lib/pronunciation/syllable-remediation'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const data: RemediationData = {
  ipa: '/iː/',
  articulationEs: ['Estira los labios como en una sonrisa amplia'],
  spanishTip: 'En español no existe esta vocal larga.',
  visualCueEs: 'Sonrisa amplia',
  minimalPairs: [{ wordA: 'sheep', wordB: 'ship' }],
}

describe('SyllableRemediation', () => {
  it('muestra el fonema y cómo articularlo', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByText('/iː/')).toBeInTheDocument()
    expect(screen.getAllByText(/sonrisa amplia/i).length).toBeGreaterThan(0)
  })

  it('muestra la pista para hispanohablantes', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByText(/no existe esta vocal larga/i)).toBeInTheDocument()
  })

  it('ofrece los pares mínimos como ejemplo', () => {
    render(<SyllableRemediation remediation={data} />)
    expect(screen.getByRole('button', { name: /sheep/i })).toBeInTheDocument()
  })

  it('no rompe cuando faltan campos opcionales', () => {
    render(<SyllableRemediation remediation={{
      ipa: '/p/', articulationEs: [], spanishTip: null,
      visualCueEs: null, minimalPairs: [],
    }} />)
    expect(screen.getByText('/p/')).toBeInTheDocument()
  })
})
