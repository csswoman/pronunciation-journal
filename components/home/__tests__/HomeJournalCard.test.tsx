// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomeJournalCard from '@/components/home/HomeJournalCard'

const listEntries = vi.hoisted(() => vi.fn())

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/lib/date/local-date', () => ({
  getTodayLocalDateKey: () => '2026-08-02',
}))

vi.mock('@/lib/journal/queries', () => ({
  listLocalJournalEntries: (...args: unknown[]) => listEntries(...args),
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (fn: () => unknown) => {
    try {
      return fn()
    } catch {
      return undefined
    }
  },
}))

describe('HomeJournalCard', () => {
  beforeEach(() => {
    listEntries.mockReset()
  })

  it('prompts for the first entry when the journal is empty', () => {
    listEntries.mockResolvedValue([])
    // useLiveQuery mock runs sync — return [] directly
    listEntries.mockImplementation(() => [])
    render(<HomeJournalCard />)
    expect(screen.getByText('Todavía no hay entradas')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /abrir diario/i })).toHaveAttribute(
      'href',
      '/journal',
    )
  })

  it('asks to write today when there is a past entry but none for today', () => {
    listEntries.mockImplementation(() => [
      {
        id: '1',
        userId: 'user-1',
        entryDate: '2026-08-01',
        prompt: 'p',
        content: 'Yesterday I practiced sounds.',
        status: 'submitted',
        createdAt: '',
        updatedAt: '',
      },
    ])
    render(<HomeJournalCard />)
    expect(screen.getByText('Sin entrada hoy')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /escribir ahora/i })).toHaveAttribute(
      'href',
      '/journal',
    )
  })

  it('links to today when an entry already exists', () => {
    listEntries.mockImplementation(() => [
      {
        id: '1',
        userId: 'user-1',
        entryDate: '2026-08-02',
        prompt: 'p',
        content: 'I wrote about food today.',
        status: 'draft',
        createdAt: '',
        updatedAt: '',
      },
    ])
    render(<HomeJournalCard />)
    expect(screen.getByText('Entrada de hoy')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver entrada/i })).toHaveAttribute(
      'href',
      '/journal/2026-08-02',
    )
  })
})
