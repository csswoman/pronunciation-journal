// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { JournalGuidedWrite } from '@/components/journal/JournalGuidedWrite'
import type { JournalEntryRecord } from '@/lib/journal/types'

const mocks = vi.hoisted(() => ({
  useJournalEntry: vi.fn(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/hooks/useJournalEntry', () => ({
  useJournalEntry: (...args: unknown[]) => mocks.useJournalEntry(...args),
}))

const mockEntry: JournalEntryRecord = {
  id: 'test-id',
  userId: 'user-1',
  entryDate: '2026-08-23',
  prompt: 'Who did you talk to yesterday?',
  content: '',
  status: 'draft',
  createdAt: '2026-08-23T00:00:00.000Z',
  updatedAt: '2026-08-23T00:00:00.000Z',
}

describe('JournalGuidedWrite ("Completar frases")', () => {
  const updateContentMock = vi.fn()
  const submitMock = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    mocks.useJournalEntry.mockReturnValue({
      content: '',
      status: 'draft',
      saveState: 'saved',
      isOnline: true,
      correcting: false,
      updateContent: updateContentMock,
      submit: submitMock,
    })
  })

  it('renders guided template, chips and help callout matching mockup', () => {
    render(
      <JournalGuidedWrite
        entry={mockEntry}
        promptEn="Who did you talk to yesterday?"
        promptEs="¿Con quién hablaste ayer?"
        starterPrefix="Yesterday I talked to"
        options={['my brother', 'my partner', 'a friend']}
      />,
    )

    // Header
    expect(screen.getByText('Pregunta de hoy')).toBeInTheDocument()
    expect(screen.getByText('Meta: 1 frase')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Who did you talk to yesterday?' })).toBeInTheDocument()
    expect(screen.getByText('¿Con quién hablaste ayer?')).toBeInTheDocument()

    // Template
    expect(screen.getByText('Yesterday I talked to')).toBeInTheDocument()

    // Chips
    expect(screen.getByRole('button', { name: 'my brother' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'my partner' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'a friend' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /otra/i })).toBeInTheDocument()

    // Help callout
    expect(screen.getByText(/¿No sabes una palabra\? Escríbela en español entre corchetes/)).toBeInTheDocument()

    // Footer
    expect(screen.getByText('Solo tú lees esto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar frase' })).toBeDisabled()
  })

  it('updates sentence and enables submit when clicking an option chip', async () => {
    render(
      <JournalGuidedWrite
        entry={mockEntry}
        promptEn="Who did you talk to yesterday?"
        promptEs="¿Con quién hablaste ayer?"
        starterPrefix="Yesterday I talked to"
        options={['my brother', 'my partner', 'a friend']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'my brother' }))

    expect(updateContentMock).toHaveBeenCalledWith('Yesterday I talked to my brother.')

    const submitBtn = screen.getByRole('button', { name: 'Guardar frase' })
    expect(submitBtn).toBeEnabled()

    fireEvent.click(submitBtn)
    await waitFor(() => {
      expect(submitMock).toHaveBeenCalled()
      expect(mocks.push).toHaveBeenCalledWith('/journal')
    })
  })

  it('allows typing custom text when clicking "otra"', () => {
    render(
      <JournalGuidedWrite
        entry={mockEntry}
        promptEn="Who did you talk to yesterday?"
        promptEs="¿Con quién hablaste ayer?"
        starterPrefix="Yesterday I talked to"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /otra/i }))

    const input = screen.getByPlaceholderText('escribe aquí…')
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'my cousin' } })
    expect(updateContentMock).toHaveBeenCalledWith('Yesterday I talked to my cousin.')
  })

  it('cycles to the next phrase template when clicking "Cambiar frase"', () => {
    render(
      <JournalGuidedWrite
        entry={mockEntry}
        promptEn="Who did you talk to yesterday?"
        promptEs="¿Con quién hablaste ayer?"
        starterPrefix="Yesterday I talked to"
      />,
    )

    const cycleBtn = screen.getByRole('button', { name: /cambiar frase/i })
    expect(cycleBtn).toBeInTheDocument()

    fireEvent.click(cycleBtn)
    expect(screen.getByText('What do you think about your daily routine? (I think... because... For example...)')).toBeInTheDocument()
    expect(screen.getByText('I think having a clear routine is')).toBeInTheDocument()
  })

  it('allows chaining multiple sentences with "+ Otra frase"', () => {
    render(
      <JournalGuidedWrite
        entry={mockEntry}
        promptEn="Who did you talk to yesterday?"
        promptEs="¿Con quién hablaste ayer?"
        starterPrefix="Yesterday I talked to"
        options={['my brother', 'a friend']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'my brother' }))
    const addAnotherBtn = screen.getByRole('button', { name: '+ Otra frase' })
    expect(addAnotherBtn).toBeInTheDocument()

    fireEvent.click(addAnotherBtn)
    expect(screen.getByText('Yesterday I talked to my brother.')).toBeInTheDocument()
    expect(screen.getByText('2 frases')).toBeInTheDocument()
  })
})
