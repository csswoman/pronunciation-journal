// components/pronunciation-feedback/__tests__/PhonemeFix.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PhonemeFix } from '../PhonemeFix'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'

const speak = vi.fn()
vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: (...a: unknown[]) => speak(...a) }))

const explanation: PhonemeInWordExplanation = {
  segments: [
    { text: 'la ' },
    { text: '«s»', emphasis: 'grapheme' },
    { text: ' final de «goes» suena ' },
    { text: '/z/', emphasis: 'ipa' },
    { text: ' (con voz), no /s/' },
  ],
  plainEs: 'la «s» final de «goes» suena /z/ (con voz), no /s/',
  contrastEs: 'dijiste /s/ (sin voz)',
}

const remediation = {
  ipa: '/z/',
  articulationEs: ['Enciende la voz al hacer «sss»'],
  spanishTip: 'No existe en español.',
  spanishTipLongEs: null,
  hookEs: 'El zumbido de la abeja',
  visualCueEs: null,
  vowelDuration: null,
  minimalPairs: [],
}

describe('PhonemeFix', () => {
  it('renders the plain sentence as the block aria-label', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    expect(screen.getByLabelText(explanation.plainEs)).toBeInTheDocument()
  })

  it('renders the IPA segment with an underline class', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    const ipa = screen.getByText('/z/', { selector: 'span' })
    expect(ipa.className).toMatch(/underline/)
  })

  it('speaks the isolated phoneme when the audio button is clicked', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    fireEvent.click(screen.getByRole('button', { name: /\/z\// }))
    expect(speak).toHaveBeenCalledWith('/z/')
  })

  it('shows contrastEs when present', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={95} status="incorrect" />)
    expect(screen.getByText('dijiste /s/ (sin voz)')).toBeInTheDocument()
  })

  it('omits the contrast line when contrastEs is null', () => {
    render(
      <PhonemeFix
        explanation={{ ...explanation, contrastEs: null }}
        remediation={remediation}
        phonemeIpa="/z/"
        score={95}
        status="incorrect"
      />,
    )
    expect(screen.queryByText(/dijiste/)).not.toBeInTheDocument()
  })

  it('opens SoundHowTo by default when score < 70', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={55} status="incorrect" />)
    expect(screen.getByText('El zumbido de la abeja')).toBeInTheDocument()
  })

  it('keeps SoundHowTo collapsed when score >= 70', () => {
    render(<PhonemeFix explanation={explanation} remediation={remediation} phonemeIpa="/z/" score={88} status="incorrect" />)
    expect(screen.queryByText('El zumbido de la abeja')).not.toBeInTheDocument()
  })

  it('renders without SoundHowTo when remediation is null', () => {
    render(<PhonemeFix explanation={explanation} remediation={null} phonemeIpa="/z/" score={55} status="incorrect" />)
    expect(screen.queryByRole('button', { name: /cómo se hace/i })).not.toBeInTheDocument()
  })
})
