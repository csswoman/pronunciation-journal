// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DailyCompletionRate } from '../DailyCompletionRate'

describe('DailyCompletionRate', () => {
  it('renders empty state when no activity exists in last 30 days', () => {
    render(
      <DailyCompletionRate
        stats={{
          rate7: 0,
          rate30: 0,
          completedDays7: 0,
          completedDays30: 0,
          heatmap30: Array(30).fill(0),
          activeDays7: 0,
          activeDays30: 0,
          planActivityDays7: 0,
          planActivityDays30: 0,
        }}
      />,
    )

    expect(screen.getByText('Sin sesiones registradas este mes')).toBeInTheDocument()
  })

  it('renders active days, completed goals, and daily-plan activity explicitly', () => {
    render(
      <DailyCompletionRate
        stats={{
          rate7: 71,
          rate30: 50,
          completedDays7: 5,
          completedDays30: 15,
          heatmap30: [
            ...Array(15).fill(2),
            ...Array(15).fill(0),
          ],
          activeDays7: 6,
          activeDays30: 18,
          planActivityDays7: 4,
          planActivityDays30: 12,
        }}
      />,
    )

    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/de 30 días con meta/i)).toBeInTheDocument()
    expect(screen.getByText('50% del mes')).toBeInTheDocument()
    expect(screen.getByText(/Días activos:/i)).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
    expect(screen.getByText(/Días con actividad en el plan:/i)).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAccessibleName(/12 días con actividad en el plan/i)
    expect(screen.queryByText(/planes completados/i)).not.toBeInTheDocument()
  })
})
