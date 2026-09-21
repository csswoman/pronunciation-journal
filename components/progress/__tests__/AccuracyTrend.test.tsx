// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AccuracyTrend } from '../AccuracyTrend'

describe('AccuracyTrend', () => {
  it('renders empty state when no evaluated answers are available', () => {
    render(<AccuracyTrend stats={{ accuracy7: 0, totalAnswers7: 0, retrievalQuality7: null }} />)
    expect(screen.getByText('S/D')).toBeInTheDocument()
    expect(screen.getByText('Sin respuestas evaluadas esta semana')).toBeInTheDocument()
    expect(screen.queryByText(/Calidad de recuerdo/i)).toBeNull()
  })

  it('renders binary accuracy tier and retrieval quality separately', () => {
    render(
      <AccuracyTrend
        stats={{
          accuracy7: 88,
          totalAnswers7: 42,
          retrievalQuality7: 4.3,
        }}
      />,
    )

    expect(screen.getByText('88%')).toBeInTheDocument()
    expect(screen.getByText('Alta precisión')).toBeInTheDocument()
    expect(screen.getByText('Calidad de recuerdo')).toBeInTheDocument()
    expect(screen.getByText(/4.3/)).toBeInTheDocument()
    expect(screen.getByText(/Basado en 42 respuestas evaluadas/i)).toBeInTheDocument()
  })

  it('renders developing tier when accuracy is lower', () => {
    render(
      <AccuracyTrend
        stats={{
          accuracy7: 55,
          totalAnswers7: 10,
          retrievalQuality7: null,
        }}
      />,
    )

    expect(screen.getByText('55%')).toBeInTheDocument()
    expect(screen.getByText('En desarrollo')).toBeInTheDocument()
    expect(screen.queryByText(/Calidad de recuerdo/i)).toBeNull()
  })
})
