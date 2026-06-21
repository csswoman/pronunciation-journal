// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const dbMocks = vi.hoisted(() => ({
  db: { srsData: {} },
  unarchiveCore1000Word: vi.fn(async () => undefined),
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => [
    { word: 'the', archivedAt: '2026-06-21T12:00:00.000Z' },
    { word: 'be', archivedAt: '2026-06-20T12:00:00.000Z' },
  ],
}))

vi.mock('@/lib/db', () => dbMocks)
vi.mock('@/lib/core-1000/types', () => ({ CORE1000_PREFIX: 'c1k:' }))

import { ArchivedWordsPanel } from '../ArchivedWordsPanel'

describe('ArchivedWordsPanel', () => {
  it('lists archived words and restores one on click', async () => {
    const user = userEvent.setup()
    render(<ArchivedWordsPanel />)

    expect(screen.getByText('2 palabras archivadas')).toBeInTheDocument()
    expect(screen.getByText('the')).toBeInTheDocument()
    expect(screen.getByText('be')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: 'Restaurar' })[0])

    expect(dbMocks.unarchiveCore1000Word).toHaveBeenCalledWith('the')
  })
})
