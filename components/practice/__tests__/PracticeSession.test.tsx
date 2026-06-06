// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}))

vi.mock('@/lib/practice/queries', () => ({
  savePracticeAnswer: vi.fn(async () => undefined),
}))

const { persistenceState, sessionStoreMocks } = vi.hoisted(() => {
  const state = {
    active: null as null | {
      exercises: unknown[]
      currentIndex: number
      answers: unknown[]
    },
  }
  return {
    persistenceState: state,
    sessionStoreMocks: {
      evictExpiredSessions: vi.fn(async () => undefined),
      loadActiveSession: vi.fn(async () => state.active),
      createSession: vi.fn(async () => undefined),
      updateSessionProgress: vi.fn(async () => undefined),
      deleteSession: vi.fn(async () => undefined),
    },
  }
})
vi.mock('@/lib/practice/session-store', () => sessionStoreMocks)

vi.mock('@/lib/phoneme-practice/tts', () => ({
  speak: vi.fn(),
  getEnglishVoices: vi.fn(() => []),
  invalidateVoiceCache: vi.fn(),
}))
vi.mock('@/lib/pronunciation/ipa-audio', () => ({ playIpaSound: vi.fn() }))

// jsdom has no speechSynthesis — stub it so useVoiceRotation doesn't throw
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: {
    getVoices: vi.fn(() => []),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    speak: vi.fn(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    pending: false,
    speaking: false,
    paused: false,
  },
})

import PracticeSession from '../PracticeSession'
import type { PracticeExercise } from '@/lib/practice/types'

function makeExercise(slug: 'pick_word' | 'pick_sound', n: number): PracticeExercise {
  return {
    id: `${slug}-${n}`,
    slug,
    exerciseTypeId: slug === 'pick_word' ? 1 : 2,
    contentId: `42:${slug}:w${n}:a,b`,
    context: 'sound_lab',
    payload: {
      kind: 'phoneme',
      ipa: 'iː',
      targetWord: `word${n}`,
      options: [
        { id: 'a', label: `word${n}`, isCorrect: true },
        { id: 'b', label: `other${n}`, isCorrect: false },
      ],
      correctIds: ['a'],
    },
    soundId: 42,
  }
}

beforeEach(() => {
  persistenceState.active = null
  vi.clearAllMocks()
})

describe('PracticeSession', () => {
  it('without persistence: renders an exercise immediately (no loading state)', async () => {
    const exercises = [makeExercise('pick_word', 1), makeExercise('pick_word', 2)]
    render(
      <PracticeSession
        context="sound_lab"
        exercises={exercises}
        sessionLength={2}
        onSessionComplete={vi.fn()}
      />,
    )
    expect(screen.queryByText(/Cargando/i)).not.toBeInTheDocument()
    // buildSession shuffles, so we don't know which word comes first — but
    // exactly one of the two options labels must be present.
    const firstWord = await screen.findByRole('button', {
      name: /Seleccionar word[12]/i,
    })
    expect(firstWord).toBeInTheDocument()
  })

  it('with persistence: shows Loading until restore resolves, then starts fresh and creates the session', async () => {
    const exercises = [makeExercise('pick_word', 1)]
    render(
      <PracticeSession
        context="sound_lab"
        exercises={exercises}
        sessionLength={1}
        onSessionComplete={vi.fn()}
        persistence={{ userId: 'user-1', soundId: 42 }}
      />,
    )
    expect(screen.getByText(/Cargando/i)).toBeInTheDocument()
    await waitFor(() => expect(sessionStoreMocks.createSession).toHaveBeenCalledTimes(1))
    expect(sessionStoreMocks.evictExpiredSessions).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: /Seleccionar word1/i })).toBeInTheDocument()
  })

  it('with persistence: restores currentIndex and answers from Dexie', async () => {
    const ex1 = makeExercise('pick_word', 1)
    const ex2 = makeExercise('pick_word', 2)
    persistenceState.active = {
      exercises: [ex1, ex2],
      currentIndex: 1,
      answers: [
        {
          exerciseId: ex1.id,
          slug: ex1.slug,
          exerciseTypeId: ex1.exerciseTypeId,
          isCorrect: true,
          userAnswer: 'word1',
          timeMs: 1000,
          contentId: ex1.contentId,
          context: 'sound_lab',
          soundId: 42,
          completedAt: new Date(),
        },
      ],
    }

    render(
      <PracticeSession
        context="sound_lab"
        exercises={[ex1, ex2]}
        sessionLength={2}
        onSessionComplete={vi.fn()}
        persistence={{ userId: 'user-1', soundId: 42 }}
      />,
    )

    // The restored session jumps directly to exercise index 1 ("word2"), and
    // does NOT re-create the session in Dexie.
    expect(await screen.findByRole('button', { name: /Seleccionar word2/i })).toBeInTheDocument()
    expect(sessionStoreMocks.createSession).not.toHaveBeenCalled()
  })

  it('fires onSessionComplete exactly once and deletes the persisted session', async () => {
    const user = userEvent.setup()
    const onSessionComplete = vi.fn()
    const ex = makeExercise('pick_word', 1)

    render(
      <PracticeSession
        context="sound_lab"
        exercises={[ex]}
        sessionLength={1}
        onSessionComplete={onSessionComplete}
        persistence={{ userId: 'user-1', soundId: 42 }}
      />,
    )

    // Use the Skip path (single click) to avoid Pick-Word's two-step
    // select-then-check flow which races with internal state.
    const skipBtn = await screen.findByRole('button', { name: /omitir/i })
    await user.click(skipBtn)

    // After FEEDBACK_MS (1500ms) the only-exercise session transitions to
    // complete and fires the callback exactly once.
    await waitFor(
      () => expect(onSessionComplete).toHaveBeenCalledTimes(1),
      { timeout: 3000 },
    )
    expect(sessionStoreMocks.deleteSession).toHaveBeenCalledWith('user-1', 42)
  })
})
