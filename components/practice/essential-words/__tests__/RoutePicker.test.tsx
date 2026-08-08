// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RoutePicker } from '../RoutePicker'
import type { EssentialWord } from '@/lib/essential-words/types'

const WORDS: EssentialWord[] = [
  {
    rank: 1,
    word: 'run',
    pos: 'verb',
    ipa_strong: '/rʌn/',
    example_sentence: 'I run every day.',
    cefr_level: 'A2',
  },
  {
    rank: 2,
    word: 'happy',
    pos: 'adjective',
    ipa_strong: '/ˈhæpi/',
    example_sentence: 'She is happy.',
    cefr_level: 'B1',
  },
]

vi.mock('@/lib/essential-words/client', () => ({
  fetchEssentialWords: vi.fn(async () => WORDS),
}))

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: null }),
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [],
}))

describe('RoutePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the panel header and recommended option', async () => {
    render(<RoutePicker value={null} onChange={vi.fn()} />)

    expect(screen.getByText('De dónde salen las palabras nuevas')).toBeInTheDocument()
    expect(
      screen.getByText('Los repasos vencidos entran siempre, elijas lo que elijas'),
    ).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Recomendada/i })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(await screen.findByText('Nivel A2')).toBeInTheDocument()
  })

  it('calls onChange with null when Recomendada is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RoutePicker value="verbs-b1" onChange={onChange} />)

    await screen.findByText('Nivel B1')
    await user.click(screen.getByRole('radio', { name: /Recomendada/i }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('calls onChange with the route id when a themed route is selected', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<RoutePicker value={null} onChange={onChange} />)

    await screen.findByText('Nivel B1')
    await user.click(screen.getByRole('radio', { name: 'Adjetivos · Nivel B1' }))

    expect(onChange).toHaveBeenCalledWith('adjectives-b1')
  })
})
