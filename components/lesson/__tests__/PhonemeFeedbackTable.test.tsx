// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhonemeFeedbackTable } from '../PhonemeFeedbackTable'
import type { WordResult } from '@/lib/types'

const wordResults: WordResult[] = [
  {
    expected: 'staff',
    got: 'stiff',
    status: 'incorrect',
    phonemes: {
      expected: [], got: [], tip: null,
      alignment: [
        { phoneme: 's', ipa: 's', status: 'correct' },
        { phoneme: 't', ipa: 't', status: 'correct' },
        { phoneme: 'æ', ipa: 'æ', status: 'incorrect', got: 'ɪ', gotIpa: 'ɪ' },
        { phoneme: 'f', ipa: 'f', status: 'correct' },
      ],
    },
  },
]

describe('PhonemeFeedbackTable', () => {
  it('muestra la articulación en fonemas incorrectos', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.getByText(/baja la lengua al frente/i)).toBeInTheDocument()
    expect(screen.getByText('/ɪ/')).toBeInTheDocument()
  })

  it('muestra ¡Excelente! en fonemas correctos sin texto articulatorio', () => {
    render(<PhonemeFeedbackTable wordResults={wordResults} />)
    expect(screen.getAllByText('¡Excelente!')).toHaveLength(3)
  })

  it('no renderiza nada con wordResults vacío', () => {
    const { container } = render(<PhonemeFeedbackTable wordResults={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('omite palabras sin datos de fonemas sin romper', () => {
    const noPhonemes: WordResult[] = [{ expected: 'a', got: 'a', status: 'correct' }]
    const { container } = render(<PhonemeFeedbackTable wordResults={noPhonemes} />)
    expect(container).toBeEmptyDOMElement()
  })
})
