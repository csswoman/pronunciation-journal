// components/ai-coach/missions/scripted/__tests__/LineResult.test.tsx
// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LineResult } from '../LineResult'
import type { WordResult } from '@/lib/types'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

const wordResults: WordResult[] = [
  { expected: 'goes', got: 'goes', status: 'correct' },
]

const explanation: PhonemeInWordExplanation = {
  segments: [{ text: 'la ' }, { text: '/z/', emphasis: 'ipa' }, { text: ' final' }],
  plainEs: 'la /z/ final',
  contrastEs: null,
}

const remediation = {
  ipa: '/z/', articulationEs: ['paso'], spanishTip: 'tip', hookEs: 'El zumbido de la abeja',
  visualCueEs: null, vowelDuration: null, minimalPairs: [{ wordA: 'zoo', wordB: 'sue' }],
  spanishTipLongEs: null,
}

const base = {
  wordResults,
  syllableMap: new Map(),
  targetText: 'goes',
  userAudioUrl: null,
  onRetry: vi.fn(),
  onContinue: vi.fn(),
}

describe('LineResult', () => {
  it('colours the score by band (success ≥ 90)', () => {
    render(<LineResult {...base} score={96} fix={null} remediation={null} />)
    const score = screen.getByText('96%')
    expect(score.className).toMatch(/var\(--success\)/)
  })

  it('colours the score by band (warning 70–89)', () => {
    render(<LineResult {...base} score={80} fix={null} remediation={null} />)
    expect(screen.getByText('80%').className).toMatch(/var\(--warning\)/)
  })

  it('colours the score by band (error < 70)', () => {
    render(<LineResult {...base} score={55} fix={null} remediation={null} />)
    expect(screen.getByText('55%').className).toMatch(/var\(--error\)/)
  })

  it('hides PhonemeFix when fix is null', () => {
    render(<LineResult {...base} score={96} fix={null} remediation={null} />)
    expect(screen.queryByRole('button', { name: /🔊/ })).not.toBeInTheDocument()
  })

  it('renders PhonemeFix and opens SoundHowTo when score < 70', () => {
    render(
      <LineResult
        {...base}
        score={55}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={remediation}
      />,
    )
    expect(screen.getByText('El zumbido de la abeja')).toBeInTheDocument()
  })

  it('keeps SoundHowTo collapsed when score >= 70', () => {
    render(
      <LineResult
        {...base}
        score={82}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={remediation}
      />,
    )
    expect(screen.queryByText('El zumbido de la abeja')).not.toBeInTheDocument()
  })

  it('omits the ListenPanel chips row when there are no minimal pairs', () => {
    render(
      <LineResult
        {...base}
        score={82}
        fix={{ explanation, phonemeIpa: '/z/', status: 'incorrect' }}
        remediation={{ ...remediation, minimalPairs: [] }}
      />,
    )
    expect(screen.queryByText(/escucha la diferencia/i)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escuchar modelo nativo/i })).toBeInTheDocument()
  })
})
