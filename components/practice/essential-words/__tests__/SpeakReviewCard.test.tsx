// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { CoreWord } from '@/lib/core-1000/types'
import { SpeakReviewCard } from '../SpeakReviewCard'

const ENTRY: CoreWord = {
  rank: 1,
  word: 'test',
  pos: 'noun',
  ipa_strong: '/test/',
  example_sentence: 'This is a test.',
  cefr_level: 'A1',
}

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
}))

vi.mock('@/hooks/useSharedMicStream', () => ({
  useSharedMicStream: () => ({
    getStream: vi.fn(async () => ({ getTracks: () => [] })),
    release: vi.fn(),
  }),
}))

vi.mock('@/hooks/useSpeechInput', () => ({
  useSpeechInput: () => ({
    state: 'idle',
    result: null,
    error: null,
    isSupported: false,
    start: vi.fn(),
    stop: vi.fn(),
    abort: vi.fn(),
    reset: vi.fn(),
  }),
}))

describe('SpeakReviewCard', () => {
  it('shows post-snooze actions when fromSnooze is true', async () => {
    const user = userEvent.setup()
    const onKeepSnooze = vi.fn()
    const onMaster = vi.fn()

    render(
      <SpeakReviewCard
        entry={ENTRY}
        onGraded={vi.fn()}
        onArchive={vi.fn()}
        fromSnooze
        onKeepSnooze={onKeepSnooze}
        onMaster={onMaster}
      />,
    )

    expect(screen.getByRole('button', { name: 'Seguir en 90 días' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'No me la recuerdes más' })).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Seguir en 90 días' }))
    await user.click(screen.getByRole('button', { name: 'No me la recuerdes más' }))
    await user.click(screen.getByRole('button', { name: 'Sí, dominada' }))

    expect(onKeepSnooze).toHaveBeenCalledOnce()
    expect(onMaster).toHaveBeenCalledOnce()
  })

  it('hides post-snooze actions by default', () => {
    render(
      <SpeakReviewCard
        entry={ENTRY}
        onGraded={vi.fn()}
        onArchive={vi.fn()}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Seguir en 90 días' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'No me la recuerdes más' })).toBeNull()
  })
})
