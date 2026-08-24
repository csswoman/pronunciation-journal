// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { JournalEntryRecord } from '@/lib/journal/types'

const mocks = vi.hoisted(() => ({
  useJournalEntry: vi.fn(),
}))

vi.mock('@/hooks/useJournalEntry', () => ({
  useJournalEntry: (...args: unknown[]) => mocks.useJournalEntry(...args),
}))

vi.mock('@/components/journal/JournalHistoryList', () => ({
  JournalHistoryList: () => null,
}))

import { JournalWorkspace } from '@/components/journal/JournalWorkspace'

const entry: JournalEntryRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'user-1',
  entryDate: '2026-08-02',
  prompt: 'Write about a place that helps you relax.',
  content: '',
  status: 'draft',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
}

beforeEach(() => {
  mocks.useJournalEntry.mockImplementation((initial: JournalEntryRecord) => {
    const [content, setContent] = useState(initial.content)
    return {
      content,
      status: 'draft',
      saveState: 'saved',
      isOnline: true,
      correcting: false,
      correctionError: null,
      feedback: null,
      correctedContent: null,
      canSubmit: content.trim().length > 0,
      canCorrect: false,
      canResumeDraft: false,
      updateContent: setContent,
      submit: vi.fn(),
      requestCorrection: vi.fn(),
      resumeDraft: vi.fn(),
    }
  })
})

describe('JournalWorkspace starter insertion', () => {
  it('routes a clicked starter through journal state so count and CTA update', async () => {
    render(
      <JournalWorkspace
        entry={entry}
        targetLength={60}
        hintsEnabled
        onHintsEnabledChange={vi.fn()}
        starterRequest="The place where I feel calm is..."
        onStarterRequestHandled={vi.fn()}
      />,
    )

    await waitFor(() => expect(screen.getByText('7 / 60')).toBeInTheDocument())

    expect(screen.getByRole('button', { name: 'Revisar' })).toBeEnabled()
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('The place where I feel calm is')
    expect(textarea).toHaveAttribute('lang', 'en')
    expect(textarea).toHaveAttribute('placeholder', '')
    expect(screen.queryByText('¿Qué pasa después?')).not.toBeInTheDocument()
  })

  it('keeps the empty editor focused with a short placeholder and no disabled banner', () => {
    render(
      <JournalWorkspace
        entry={entry}
        targetLength={60}
        hintsEnabled
        onHintsEnabledChange={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', 'Empieza a escribir…')
    // El botón Revisar no se muestra deshabilitado con banner cuando está vacío
    expect(screen.queryByRole('button', { name: 'Revisar' })).not.toBeInTheDocument()
  })

  it('updates the same count path when the learner types manually', async () => {
    render(
      <JournalWorkspace
        entry={entry}
        targetLength={60}
        hintsEnabled
        onHintsEnabledChange={vi.fn()}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I write today' } })

    await waitFor(() => expect(screen.getByText('3 / 60')).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Revisar' })).toBeEnabled()
  })
})
