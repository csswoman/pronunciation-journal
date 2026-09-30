// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewHeroCard } from '../ReviewHeroCard'

describe('ReviewHeroCard', () => {
  it('reports "nada pendiente" when every category count is zero, instead of claiming five sources', () => {
    render(
      <ReviewHeroCard
        totalCount={0}
        vocabCount={0}
        weakWordsCount={0}
        soundsCount={0}
        sentencesCount={0}
        onStartReview={vi.fn()}
      />,
    )

    expect(screen.getByText('nada pendiente')).toBeInTheDocument()
    expect(screen.queryByText(/fuentes distintas/)).not.toBeInTheDocument()
  })

  it('reports the real singular source label with exactly one active category', () => {
    render(
      <ReviewHeroCard
        totalCount={3}
        vocabCount={3}
        weakWordsCount={0}
        soundsCount={0}
        sentencesCount={0}
        onStartReview={vi.fn()}
      />,
    )

    expect(screen.getByText('de una fuente')).toBeInTheDocument()
  })

  it('does not show the overdue callout when overdueOneWeekCount is 0 (the real default)', () => {
    render(
      <ReviewHeroCard
        totalCount={1}
        vocabCount={1}
        weakWordsCount={0}
        soundsCount={0}
        sentencesCount={0}
        onStartReview={vi.fn()}
      />,
    )

    expect(screen.queryByText(/llevan más de una semana esperando/)).not.toBeInTheDocument()
  })

  it('calls onStartShortReview, not onStartReview, when provided and "Solo 10" is clicked', () => {
    const onStartReview = vi.fn()
    const onStartShortReview = vi.fn()

    render(
      <ReviewHeroCard
        totalCount={12}
        vocabCount={12}
        weakWordsCount={0}
        soundsCount={0}
        sentencesCount={0}
        onStartReview={onStartReview}
        onStartShortReview={onStartShortReview}
      />,
    )

    screen.getByText(/Solo 10/).click()
    expect(onStartShortReview).toHaveBeenCalledTimes(1)
    expect(onStartReview).not.toHaveBeenCalled()
  })
})
