'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { buildSession } from '@/lib/phoneme-practice/exercises'
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        allSounds.map(s => [s.id, allWords.filter(w => w.sound_id === s.id)])
      )

      // Build mixed session across due sounds, capped at MAX_EXERCISES
      const allExercises: Exercise[] = []
      for (const p of dueProgress) {
        if (allExercises.length >= MAX_EXERCISES) break
        const pairs = await getMinimalPairs(p.sound_id)
        const targetWords = allWords.filter(w => w.sound_id === p.sound_id)
        const session = buildSession(
          p.sounds,
          targetWords,
          allSounds,
          wordsBySoundId,
          pairs
        )
        const remaining = MAX_EXERCISES - allExercises.length
        allExercises.push(...session.slice(0, remaining))
      }

      setExercises(allExercises)
      setExerciseStartedAt(Date.now())

      const pMap = new Map<number, UserSoundProgress>()
      for (const p of dueProgress) pMap.set(p.sound_id, p)
      setProgressMap(pMap)
    } catch (e) {
      setError('Failed to load review session.')
      console.error(e)
    }
  }

  const session = usePracticeSession(exercises ?? [])

  async function handleAnswer(isCorrect: boolean, userAnswer: string) {
    setCurrentFeedback({ isCorrect })
    session.submitAnswer({ isCorrect, userAnswer, startedAt: exerciseStartedAt })
  }

  async function handleNext() {
    if (session.isComplete && user) {
      await finishSession()
    }
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
  }

  async function finishSession() {
    if (!user) return
    const answers = session.answers

    await saveAnswers(user.id, answers)

    // Group answers by sound
    const bySoundId = new Map<number, typeof answers>()
    for (const a of answers) {
      const list = bySoundId.get(a.soundId) ?? []
      list.push(a)
      bySoundId.set(a.soundId, list)
    }

    for (const [soundId, soundAnswers] of bySoundId) {
      const correct = soundAnswers.filter(a => a.isCorrect).length
      const base: UserSoundProgress = progressMap.get(soundId) ?? {
        id: '', user_id: user.id, sound_id: soundId, status: 'available',
        total_attempts: 0, correct_answers: 0, streak: 0, best_streak: 0,
        last_practiced: null, next_review: null, ease_factor: 2.5, interval_days: 1,
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
        const allIds = allProgress.map(p => p.sound_id).sort((a, b) => a - b)
        const nextId = getNextUnlockedSoundId(allProgress, allIds)
        if (nextId) await unlockNextSound(user.id, nextId)
      }
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-red-500">{error}</p>
          <button
            onClick={() => { setError(null); setSessionKey(k => k + 1) }}
            className="px-4 py-2 rounded-lg text-white" style={{backgroundColor: 'var(--primary)'}}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!exercises) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading review…</div>
      </div>
    )
  }

  if (session.isComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionSummary
          answers={session.answers}
          soundIpa="Review"
          nextReview={null}
          onPracticeAgain={() => { setExercises(null); setSessionKey(k => k + 1) }}
        />
      </div>
    )
  }

  const ex = session.currentExercise
  if (!ex) return null

  function renderExercise() {
    if (!ex) return null
    const submitHandler = (isCorrect: boolean, userAnswer: string) =>
      handleAnswer(isCorrect, userAnswer)
    switch (ex.type) {
      case 'pick_word':    return <PickWordExercise exercise={ex} onSubmit={submitHandler} />
      case 'pick_sound':   return <PickSoundExercise exercise={ex} onSubmit={submitHandler} />
      case 'minimal_pair': return <MinimalPairExercise exercise={ex} onSubmit={submitHandler} />
      case 'dictation':    return <DictationExercise exercise={ex} onSubmit={submitHandler} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          ← Back
        </button>

        <ExerciseCard
          current={session.currentIndex + 1}
          total={session.total}
          exerciseType={ex.type}
          feedback={currentFeedback}
          onNext={currentFeedback ? handleNext : undefined}
        >
          {renderExercise()}
        </ExerciseCard>
      </div>
    </div>
  )
}
