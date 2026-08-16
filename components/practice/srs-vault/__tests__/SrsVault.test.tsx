// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { SRSData } from '@/lib/types'

const vaultEntries: SRSData[] = [
  {
    wordId: 'c1k:apple',
    word: 'apple',
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2026-08-01T00:00:00.000Z',
    status: 'snoozed',
    snoozedAt: '2026-07-01T00:00:00.000Z',
  },
  {
    wordId: 'c1k:cat',
    word: 'cat',
    ease: 2.5,
    interval: 1,
    repetitions: 1,
    nextReview: '2099-01-01T00:00:00.000Z',
    status: 'mastered',
    masteredAt: '2026-07-10T00:00:00.000Z',
  },
]

const dbMocks = vi.hoisted(() => ({
  migrateArchivedSrsRows: vi.fn(async () => 0),
  masterEssentialWord: vi.fn(async () => undefined),
  snoozeEssentialWord: vi.fn(async () => undefined),
  activateEssentialWordNow: vi.fn(async () => undefined),
  db: {
    srsData: {
      toArray: vi.fn(async () => vaultEntries),
    },
  },
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => vaultEntries,
}))

vi.mock('@/lib/db', () => dbMocks)

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

import { SrsVault } from '../SrsVault'
import { SrsVaultTrigger } from '../SrsVaultTrigger'

describe('SrsVault', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    HTMLDialogElement.prototype.showModal = vi.fn(function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '')
    })
    HTMLDialogElement.prototype.close = vi.fn(function closeDialog(this: HTMLDialogElement) {
      this.removeAttribute('open')
      this.dispatchEvent(new Event('close'))
    })
  })

  it('runs archived migration once on mount', () => {
    render(<SrsVault />)
    expect(dbMocks.migrateArchivedSrsRows).toHaveBeenCalledTimes(1)
    expect(dbMocks.migrateArchivedSrsRows).toHaveBeenCalledWith('user-1')
  })

  it('shows trigger text with vault count', () => {
    render(<SrsVault />)
    expect(screen.getByRole('button', { name: 'Baúl · 2 palabras' })).toBeInTheDocument()
  })

  it('keeps the vault available when it is empty', () => {
    render(<SrsVaultTrigger count={0} onOpen={vi.fn()} />)
    expect(screen.getByRole('button', { name: 'Baúl' })).toBeInTheDocument()
  })

  it('opens the modal when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<SrsVault />)

    await user.click(screen.getByRole('button', { name: 'Baúl · 2 palabras' }))

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Baúl' })).toBeInTheDocument()
  })

  it('calls masterEssentialWord from a snoozed row after confirm', async () => {
    const user = userEvent.setup()
    render(<SrsVault />)

    await user.click(screen.getByRole('button', { name: 'Baúl · 2 palabras' }))
    await user.click(screen.getByRole('button', { name: 'En pausa' }))
    await user.click(screen.getByRole('button', { name: 'Dominada' }))
    await user.click(screen.getByRole('button', { name: 'Sí, dominada' }))

    expect(dbMocks.masterEssentialWord).toHaveBeenCalledWith('apple', 'user-1')
  })
})
