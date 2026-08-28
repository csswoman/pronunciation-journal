// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GrammarRuleCard } from '../GrammarRuleCard'
import type { DailyStep } from '@/lib/practice/types'

function rule(
  overrides: Partial<NonNullable<DailyStep['grammarRule']>> = {},
): NonNullable<DailyStep['grammarRule']> {
  return {
    deckSlug: 'present-perfect',
    title: 'Present Perfect',
    goal: 'Habla de experiencias sin decir cuándo pasaron.',
    rows: [
      { key: 'Forma', value: 'have/has + participio' },
      { key: 'Uso', value: 'Experiencia pasada, resultado presente' },
    ],
    ...overrides,
  }
}

describe('GrammarRuleCard', () => {
  it('renders the title and goal', () => {
    render(<GrammarRuleCard rule={rule()} onContinue={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Present Perfect' })).toBeTruthy()
    expect(screen.getByText('Habla de experiencias sin decir cuándo pasaron.')).toBeTruthy()
  })

  it('renders each rule row key and value', () => {
    render(<GrammarRuleCard rule={rule()} onContinue={vi.fn()} />)

    expect(screen.getByText('Forma')).toBeTruthy()
    expect(screen.getByText('have/has + participio')).toBeTruthy()
    expect(screen.getByText('Uso')).toBeTruthy()
    expect(screen.getByText('Experiencia pasada, resultado presente')).toBeTruthy()
  })

  it('does not render a goal paragraph when the rule has none', () => {
    render(<GrammarRuleCard rule={rule({ goal: '' })} onContinue={vi.fn()} />)
    expect(screen.queryByText(/experiencias/i)).toBeNull()
  })

  it('calls onContinue when the practice button is clicked', async () => {
    const user = userEvent.setup()
    const onContinue = vi.fn()
    render(<GrammarRuleCard rule={rule()} onContinue={onContinue} />)

    await user.click(screen.getByRole('button', { name: 'Practicar' }))
    expect(onContinue).toHaveBeenCalledOnce()
  })
})
