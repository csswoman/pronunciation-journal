// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PhonemeDifficultyHeadword } from '../PhonemeDifficultyHeadword'
import type { WordResult } from '@/lib/types'

function difficult(expected: string, ipa: string, phoneme: string): WordResult[] {
  return [
    {
      expected,
      got: expected,
      status: 'incorrect',
      phonemes: {
        expected: [], got: [], tip: null,
        alignment: [{ phoneme, ipa, status: 'incorrect', got: 'IH', gotIpa: 'ɪ' }],
      },
    },
  ]
}

/** Fragmentos resaltados, en orden de aparición. */
function highlighted(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span.text-primary')).map(
    (el) => el.textContent ?? '',
  )
}

describe('PhonemeDifficultyHeadword', () => {
  it('resalta la grafía "a" de "favorite" para /eɪ/', () => {
    const { container } = render(
      <PhonemeDifficultyHeadword wordResults={difficult('favorite', 'eɪ', 'EY')} />,
    )
    expect(screen.getByText('/eɪ/')).toBeInTheDocument()
    expect(highlighted(container)[0]).toBe('a')
  })

  it('resalta "th" en "think" para /θ/', () => {
    const { container } = render(
      <PhonemeDifficultyHeadword wordResults={difficult('think', 'θ', 'TH')} />,
    )
    expect(highlighted(container)).toEqual(['th'])
  })

  it('no renderiza nada cuando no hay dificultad que señalar', () => {
    const { container } = render(
      <PhonemeDifficultyHeadword
        wordResults={[{ expected: 'staff', got: 'staff', status: 'correct' }]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('no renderiza nada cuando el fonema no tiene símbolo IPA', () => {
    const { container } = render(
      <PhonemeDifficultyHeadword
        wordResults={[
          {
            expected: 'staff',
            got: 'stiff',
            status: 'incorrect',
            phonemes: {
              expected: [], got: [], tip: null,
              alignment: [{ phoneme: 'ZZZ', status: 'incorrect' }],
            },
          },
        ]}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
