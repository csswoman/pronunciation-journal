// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { JournalEntryRecord } from '@/lib/journal/types'

const { saveJournalEntry, getLocalJournalEntry, correctJournalEntry, JournalCorrectionError } =
  vi.hoisted(() => {
    class JournalCorrectionError extends Error {
      code: 'offline' | 'network' | 'server'
      constructor(message: string, code: 'offline' | 'network' | 'server') {
        super(message)
        this.name = 'JournalCorrectionError'
        this.code = code
      }
    }
    return {
      saveJournalEntry: vi.fn(),
      getLocalJournalEntry: vi.fn(),
      correctJournalEntry: vi.fn(),
      JournalCorrectionError,
    }
  })

vi.mock('@/lib/journal/queries', () => ({
  saveJournalEntry: (...args: unknown[]) => saveJournalEntry(...args),
  getLocalJournalEntry: (...args: unknown[]) => getLocalJournalEntry(...args),
}))

vi.mock('@/lib/journal/correct-client', () => ({
  correctJournalEntry: (...args: unknown[]) => correctJournalEntry(...args),
  JournalCorrectionError,
}))

import { useJournalEntry } from '@/hooks/useJournalEntry'

const baseEntry: JournalEntryRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  userId: 'u1',
  entryDate: '2026-07-18',
  prompt: 'What did you do today?',
  content: '',
  status: 'draft',
  createdAt: '2026-07-18T00:00:00.000Z',
  updatedAt: '2026-07-18T00:00:00.000Z',
}

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(() => {
  saveJournalEntry.mockReset().mockResolvedValue(undefined)
  getLocalJournalEntry.mockReset().mockResolvedValue(undefined)
  correctJournalEntry.mockReset()
  setOnline(true)
  vi.useFakeTimers()
})

afterEach(() => {
  vi.runOnlyPendingTimers()
  vi.useRealTimers()
})

describe('useJournalEntry', () => {
  it('autosaves a draft after the debounce', async () => {
    const { result } = renderHook(() => useJournalEntry(baseEntry))

    act(() => result.current.updateContent('Today I studied.'))
    expect(result.current.saveState).toBe('pending')

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    expect(saveJournalEntry).toHaveBeenCalledTimes(1)
    expect(saveJournalEntry.mock.calls[0][0]).toMatchObject({
      content: 'Today I studied.',
      status: 'draft',
    })
    expect(result.current.saveState).toBe('saved')
  })

  it('submits and corrects when online, ending in corrected with feedback', async () => {
    correctJournalEntry.mockResolvedValue({
      correctedContent: 'Today I studied English.',
      errors: [{ quote: 'I study', correction: 'I studied', type: 'tense', explanationEs: 'Pasado.', topic: 'grammar:past_simple' }],
      newWords: ['commute'],
    })
    const { result } = renderHook(() => useJournalEntry(baseEntry))

    act(() => result.current.updateContent('Today I study English.'))
    await act(async () => {
      await result.current.submit()
    })

    expect(correctJournalEntry).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('corrected')
    expect(result.current.correctedContent).toBe('Today I studied English.')
    expect(result.current.feedback?.newWords).toEqual(['commute'])
    // submitted save + corrected save
    expect(saveJournalEntry.mock.calls.some((c) => c[0].status === 'submitted')).toBe(true)
    expect(saveJournalEntry.mock.calls.some((c) => c[0].status === 'corrected')).toBe(true)
  })

  it('keeps the entry submitted when offline and offers correction on reconnect', async () => {
    setOnline(false)
    const { result } = renderHook(() => useJournalEntry(baseEntry))

    act(() => result.current.updateContent('Offline draft.'))
    await act(async () => {
      await result.current.submit()
    })

    expect(correctJournalEntry).not.toHaveBeenCalled()
    expect(result.current.status).toBe('submitted')
    expect(result.current.canCorrect).toBe(false)

    correctJournalEntry.mockResolvedValue({ correctedContent: 'Offline draft.', errors: [], newWords: [] })
    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current.canCorrect).toBe(true)

    await act(async () => {
      await result.current.requestCorrection()
    })
    expect(correctJournalEntry).toHaveBeenCalledTimes(1)
    expect(result.current.status).toBe('corrected')
  })

  it('surfaces a public correction error and stays submitted', async () => {
    correctJournalEntry.mockRejectedValue(new JournalCorrectionError('AI no disponible.', 'server'))
    const { result } = renderHook(() => useJournalEntry(baseEntry))

    act(() => result.current.updateContent('Try me.'))
    await act(async () => {
      await result.current.submit()
    })

    expect(result.current.status).toBe('submitted')
    expect(result.current.correctionError).toBe('AI no disponible.')
  })

  it('hydrates from a newer local copy on mount', async () => {
    getLocalJournalEntry.mockResolvedValue({ ...baseEntry, content: 'Recovered draft', status: 'draft' })
    const { result } = renderHook(() => useJournalEntry(baseEntry))

    await act(async () => {
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(result.current.content).toBe('Recovered draft')
  })
})
