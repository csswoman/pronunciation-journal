// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReviewForecastCard } from '../ReviewForecastCard'

describe('ReviewForecastCard', () => {
  it('renders real per-day counts when forecastDays is provided, not the fixed 4/6/29/7/2/8 mock', () => {
    const forecastDays = [
      { dayLabel: 'HOY', count: 3, isToday: true },
      { dayLabel: 'V', count: 0, isToday: false },
      { dayLabel: 'S', count: 0, isToday: false },
      { dayLabel: 'D', count: 0, isToday: false },
      { dayLabel: 'L', count: 0, isToday: false },
      { dayLabel: 'M', count: 0, isToday: false },
      { dayLabel: 'X', count: 0, isToday: false },
    ]

    render(<ReviewForecastCard todayCount={3} forecastDays={forecastDays} />)

    expect(screen.queryByText('29')).not.toBeInTheDocument()
    expect(screen.getByText('No hay repasos programados para los próximos días.')).toBeInTheDocument()
  })

  it('reports a real upcoming peak day and reduces it by the real today count', () => {
    const forecastDays = [
      { dayLabel: 'HOY', count: 2, isToday: true },
      { dayLabel: 'V', count: 5, isToday: false },
      { dayLabel: 'S', count: 0, isToday: false },
      { dayLabel: 'D', count: 0, isToday: false },
      { dayLabel: 'L', count: 0, isToday: false },
      { dayLabel: 'M', count: 0, isToday: false },
      { dayLabel: 'X', count: 0, isToday: false },
    ]

    render(<ReviewForecastCard todayCount={2} forecastDays={forecastDays} />)

    expect(screen.getByText('5 repasos')).toBeInTheDocument()
    // peakReduced = 5 - todayCount(2) = 3
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('falls back to only today real count, with every other day at zero, when no forecastDays is passed', () => {
    render(<ReviewForecastCard todayCount={4} />)

    // The "HOY" bar shows the real total; nothing invents the rest of the week.
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    expect(screen.getByText('No hay repasos programados para los próximos días.')).toBeInTheDocument()
  })
})
