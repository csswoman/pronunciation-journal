// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductionFeedback } from '../ProductionFeedback'

describe('ProductionFeedback', () => {
  it('clearly explains when the target word was missing and provides criteria chips and tutor feedback', () => {
    render(
      <ProductionFeedback
        transcript="Insurance Company"
        grade={{
          correct: false,
          usedTarget: false,
          grammaticallyCorrect: false,
          constraintMet: true,
          score: 0,
          feedback: 'Try using the target phrase in a sentence.',
        }}
      />,
    )

    expect(screen.getByText('Falta la palabra objetivo')).toBeInTheDocument()
    expect(screen.getByText(/Insurance Company/)).toBeInTheDocument()
    expect(screen.getByText('Palabra clave: no detectada')).toBeInTheDocument()
    expect(screen.getByText('Gramática: con ajustes')).toBeInTheDocument()
    expect(screen.getByText('Observaciones del tutor')).toBeInTheDocument()
    expect(screen.getByText('Try using the target phrase in a sentence.')).toBeInTheDocument()
  })

  it('renders the user sentence and underlines error words compared to suggestions', () => {
    render(
      <ProductionFeedback
        userSentence="I achieve my certification yesterday."
        grade={{
          correct: false,
          usedTarget: true,
          grammaticallyCorrect: false,
          constraintMet: true,
          score: 40,
          feedback: 'Use past tense achieved.',
          corrections: 'I achieved my certification yesterday.',
        }}
      />,
    )

    expect(screen.getByText('Buen intento — revisa la gramática')).toBeInTheDocument()
    expect(screen.getByText('Tu oración')).toBeInTheDocument()
    expect(screen.getByText('achieve')).toHaveClass('underline')
    expect(screen.getByText('Versión sugerida')).toBeInTheDocument()
    expect(screen.getByText('achieved')).toBeInTheDocument()
    expect(screen.getByText('Observaciones del tutor')).toBeInTheDocument()
    expect(screen.getByText('Use past tense achieved.')).toBeInTheDocument()
  })

  it('renders clean user sentence without diff when correct', () => {
    render(
      <ProductionFeedback
        userSentence="I achieved my certification."
        grade={{
          correct: true,
          usedTarget: true,
          grammaticallyCorrect: true,
          constraintMet: true,
          score: 100,
          feedback: 'Great sentence!',
        }}
      />,
    )

    expect(screen.getByText('¡Excelente oración!')).toBeInTheDocument()
    expect(screen.getByText('Tu oración')).toBeInTheDocument()
    expect(screen.getByText('I achieved my certification.')).toBeInTheDocument()
    expect(screen.queryByText('Versión sugerida')).not.toBeInTheDocument()
    expect(screen.getByText('Palabra clave: usada')).toBeInTheDocument()
    expect(screen.getByText('Gramática: correcta')).toBeInTheDocument()
  })
})
