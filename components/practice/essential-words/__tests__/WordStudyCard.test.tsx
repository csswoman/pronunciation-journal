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

  it('renders validated study content instead of the legacy one-sentence fallback', () => {
    render(
      <WordStudyCard
        entry={{
          rank: 4,
          word: 'to',
          pos: 'preposition',
          ipa_strong: '/tuː/',
          example_sentence: 'I want to go home.',
          cefr_level: 'A1',
          study: {
            definitionEs: 'Preposición que indica destino o dirección.',
            translation: ['a', 'hacia'],
            translationNote: 'depende de la estructura',
            pronunciation: {
              soundAnchors: [{ id: 'schwa', ipa: '/ə/', explanationEs: 'vocal relajada' }],
              variants: [{
                id: 'before_consonant_sound',
                labelEs: 'Antes de sonido de consonante',
                ipa: '/tə/',
                spokenExample: '**to** school',
                anchorIds: ['schwa'],
              }],
            },
            examples: [{
              english: 'I go **to** school.',
              translationEs: 'Voy a la escuela.',
              variantId: 'before_consonant_sound',
            }],
          },
        }}
        onContinue={vi.fn()}
        onOmit={vi.fn()}
      />,
    )

    expect(screen.getByText('a y hacia')).toBeInTheDocument()
    expect(screen.getByText('Cómo suena')).toBeInTheDocument()
    expect(screen.getByText('Voy a la escuela.')).toBeInTheDocument()
    expect(screen.queryByText('I want to go home.')).not.toBeInTheDocument()
  })
})
