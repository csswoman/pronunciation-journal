// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WordStudyCard } from '../WordStudyCard'

vi.mock('@/lib/phoneme-practice/tts', () => ({ speak: vi.fn() }))

describe('WordStudyCard', () => {
  it('names the next action after presenting a new word', () => {
    render(
      <WordStudyCard
        entry={{
          rank: 1,
          word: 'increase',
          pos: 'verb',
          ipa_strong: '/ɪnˈkriːs/',
          example_sentence: 'Sales increase this year.',
          cefr_level: 'A2',
          meaning: 'To become or make larger in amount',
          translation: 'aumentar',
        }}
        contextLine="Palabra nueva · bloque 1 de 1"
        onContinue={vi.fn()}
        onOmit={vi.fn()}
      />,
    )

    expect(screen.getByText('Palabra nueva · bloque 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continuar con la práctica' })).toBeInTheDocument()
  })
})
