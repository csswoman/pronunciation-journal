'use client'

import Button from '@/components/ui/Button'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import {
  getAllSounds,
  getAllWords,
  getMinimalPairs,
  getSoundsForToday,
  getAllProgress,
  saveAnswers,
  updateProgress,
  markMastered,
  unlockNextSound,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { isMastered, getNextUnlockedSoundId } from '@/lib/phoneme-practice/mastery'
import type { Exercise, UserSoundProgress } from '@/lib/phoneme-practice/types'

const MAX_EXERCISES = 10

export default function ReviewPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [progressMap, setProgressMap] = useState<Map<number, UserSoundProgress>>(new Map())
  const [error, setError] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean } | null>(null)
  const [exerciseStartedAt, setExerciseStartedAt] = useState(Date.now())
  const [sessionKey, setSessionKey] = useState(0)

  useEffect(() => {
    if (!user) return
    loadReview()
  }, [user, sessionKey])

  async function loadReview() {
    try {
      const [dueProgress, allSounds, allWords] = await Promise.all([
        getSoundsForToday(user!.id),
        getAllSounds(),
        getAllWords(),
      ])

      if (dueProgress.length === 0) {
        router.replace('/dashboard')
        return
      }

      const wordsBySoundId = new Map(
        allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
      )

      const allExercises: Exercise[] = []
      for (const p of dueProgress) {
        if (allExercises.length >= MAX_EXERCISES) break
        const pairs = await getMinimalPairs(p.sound_id)
        const targetWords = allWords.filter((w) => w.sound_id === p.sound_id)
        const mixed = buildMixedSession(p.sounds, targetWords, allSounds, wordsBySoundId, pairs)
        const session = mixed.filter((e) => e.kind === 'phoneme').map((e) => e.data)
        const remaining = MAX_EXERCISES - allExercises.length
        allExercises.push(...session.slice(0, remaining))
      }

      setExercises(allExercises)
      setExerciseStartedAt(Date.now())
      setCurrentFeedback(null)

      const pMap = new Map<number, UserSoundProgress>()
      for (const p of dueProgress) pMap.set(p.sound_id, p)
      setProgressMap(pMap)
    } catch (e) {
      setError('No se pudo cargar la sesión de repaso.')
      console.error(e)
    }
  }

  const session = usePracticeSession(exercises ?? [])

  useEffect(() => {
    if (session.isComplete && user) {
      finishSession()
    }
  }, [session.isComplete])

  async function handleAnswer(isCorrect: boolean, userAnswer: string) {
    setCurrentFeedback({ isCorrect })
    session.submitAnswer({ isCorrect, userAnswer, startedAt: exerciseStartedAt })
  }

  function handleNext() {
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
    session.advance()
  }

  async function finishSession() {
    if (!user) return
    const answers = session.answers

    await saveAnswers(user.id, answers)

    const bySoundId = new Map<number, typeof answers>()
    for (const a of answers) {
      const list = bySoundId.get(a.soundId) ?? []
      list.push(a)
      bySoundId.set(a.soundId, list)
    }

    for (const [soundId, soundAnswers] of bySoundId) {
      const correct = soundAnswers.filter((a) => a.isCorrect).length
      const base: UserSoundProgress = progressMap.get(soundId) ?? {
        id: '',
        user_id: user.id,
        sound_id: soundId,
        status: 'available',
        total_attempts: 0,
        correct_answers: 0,
        streak: 0,
        best_streak: 0,
        last_practiced: null,
        next_review: null,
        ease_factor: 2.5,
        interval_days: 1,
      }
      const sessionIsCorrect = correct >= Math.ceil(soundAnswers.length / 2)
      const sr = updateSR(base, sessionIsCorrect)
      await updateProgress(user.id, soundId, correct, soundAnswers.length, sr)

      const updated: UserSoundProgress = {
        ...base,
        total_attempts: base.total_attempts + soundAnswers.length,
        correct_answers: base.correct_answers + correct,
        streak: sr.streak,
      }
      if (isMastered(updated)) {
        await markMastered(user.id, soundId)
        const allProgress = await getAllProgress(user.id)
        const allIds = allProgress.map((p) => p.sound_id).sort((a, b) => a - b)
        const nextId = getNextUnlockedSoundId(allProgress, allIds)
        if (nextId) await unlockNextSound(user.id, nextId)
      }
    }
  }

  if (error) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center p-4">
        <div className="space-y-3 text-center">
          <p className="text-error">{error}</p>
          <Button
            onClick={() => {
              setError(null)
              setSessionKey((k) => k + 1)
            }}
            variant="primary"
            size="sm"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (!exercises) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Cargando repaso…</div>
      </div>
    )
  }

  const progressPct = Math.min(
    100,
    Math.round((session.currentQueuePos / Math.max(session.queueLength, 1)) * 100),
  )

  if (session.isComplete) {
    return (
      <PhonemeFocusShell badge="Repaso" progressPct={100} onExit={() => router.push('/dashboard')}>
        <div className="phoneme-focus__summary">
          <SessionSummary
            soundIpa="Repaso"
            scoreableCorrect={session.scoreableCorrect}
            originalTotal={session.originalTotal}
            nextReview={null}
            onPracticeAgain={() => {
              setExercises(null)
              setSessionKey((k) => k + 1)
            }}
          />
        </div>
      </PhonemeFocusShell>
    )
  }

  const ex = session.currentExercise
  if (!ex) return null

  const badge = ex.ipa?.trim() || 'Repaso'

  function renderExercise() {
    const submitHandler = (isCorrect: boolean, userAnswer: string) =>
      handleAnswer(isCorrect, userAnswer)
    switch (ex.type) {
      case 'pick_word':
        return <PickWordExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'pick_sound':
        return <PickSoundExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'minimal_pair':
        return <MinimalPairExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'dictation':
        return <DictationExercise exercise={ex} onSubmit={submitHandler} focusUi />
      case 'speak_word':
        return <SpeakExercise exercise={ex} onSubmit={submitHandler} focusUi />
      default:
        return null
    }
  }

  return (
    <PhonemeFocusShell
      badge={badge}
      progressPct={progressPct}
      onExit={() => router.back()}
      feedback={
        currentFeedback
          ? {
              isCorrect: currentFeedback.isCorrect,
              subtitle: currentFeedback.isCorrect
                ? 'Buen trabajo — sigue con el siguiente'
                : 'Repasa el sonido e inténtalo otra vez',
              onContinue: handleNext,
            }
          : null
      }
    >
      <div key={session.currentQueuePos}>{renderExercise()}</div>
    </PhonemeFocusShell>
  )
}
