// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProductionFeedback } from '../ProductionFeedback'

describe('ProductionFeedback', () => {
  it('requests a retry without assigning grammar feedback when the target was not recognized', () => {
    render(
      <ProductionFeedback
        transcript="Insurance Company"
        grade={{
          correct: false,
          usedTarget: false,
          grammaticallyCorrect: false,
          score: 0,
          feedback: 'Try using the target phrase in a sentence.',
        }}
      />,
    )

    expect(screen.getByText('No pudimos verificar la palabra objetivo.')).toBeInTheDocument()
    expect(screen.getByText('Entendimos: “Insurance Company”')).toBeInTheDocument()
    expect(screen.queryByText('Gramática')).not.toBeInTheDocument()
    expect(screen.queryByText(/Puntuación/)).not.toBeInTheDocument()
  })
})
