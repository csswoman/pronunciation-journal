'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { StageLobby } from '@/components/phoneme-practice/StageLobby'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { buildStageSession } from '@/lib/phoneme-practice/exercises'
import {
  getAllSounds,
  getAllWords,
  getMinimalPairs,
  getSoundById,
  saveAnswers,
  updateProgress,
  markMastered,
  unlockNextSound,
  getAllProgress,
  getAnswerHistoryForSound,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { isMastered, getNextUnlockedSoundId } from '@/lib/phoneme-practice/mastery'
import { computeStageMastery } from '@/lib/phoneme-practice/stages'
import type { StageId, StageMasteryMap } from '@/lib/phoneme-practice/stages'
import type { Exercise, UserSoundProgress, Sound, SoundWord, MinimalPair } from '@/lib/phoneme-practice/types'

type View = 'lobby' | 'session' | 'summary'

interface SessionData {
  sound: Sound
  allSounds: Sound[]
  allWordsBySoundId: Map<number, SoundWord[]>
  targetWords: SoundWord[]
  pairs: MinimalPair[]
}

export default function PracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const { user } = useAuth()
  const router = useRouter()

  const [view, setView] = useState<View>('lobby')
  const [, setActiveStage] = useState<StageId | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [mastery, setMastery] = useState<StageMasteryMap | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean } | null>(null)
  const [exerciseStartedAt, setExerciseStartedAt] = useState(Date.now())
  const [nextReview, setNextReview] = useState<Date | null>(null)
  const [currentProgress, setCurrentProgress] = useState<UserSoundProgress | null>(null)

  const loadLobby = useCallback(async () => {
    if (!user) return
    try {
      const [sound, allSounds, allWords, pairs, history] = await Promise.all([
        getSoundById(soundId),
        getAllSounds(),
        getAllWords(),
        getMinimalPairs(soundId),
        getAnswerHistoryForSound(user.id, soundId),
      ])

      const targetWords = allWords.filter(w => w.sound_id === soundId)
      const allWordsBySoundId = new Map(
        allSounds.map(s => [s.id, allWords.filter(w => w.sound_id === s.id)])
      )

      setSessionData({ sound, allSounds, allWordsBySoundId, targetWords, pairs })
      setMastery(computeStageMastery(history))

      const progress = await getAllProgress(user.id)
      const p = progress.find(r => r.sound_id === soundId) ?? null
      setCurrentProgress(p)
    } catch {
      setError('Failed to load. Please try again.')
    }
  }, [soundId, user])

  useEffect(() => {
    loadLobby()
  }, [loadLobby])

  function handleSelectStage(stageId: StageId) {
    if (!sessionData) return
    const { sound, allSounds, allWordsBySoundId, targetWords, pairs } = sessionData
    const exs = buildStageSession(stageId, sound, targetWords, allSounds, allWordsBySoundId, pairs)
    if (exs.length === 0) return
    setActiveStage(stageId)
    setExercises(exs)
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
    setView('session')
  }

  const session = usePracticeSession(exercises ?? [])

  async function handleAnswer(isCorrect: boolean, userAnswer: string) {
    setCurrentFeedback({ isCorrect })
    session.submitAnswer({ isCorrect, userAnswer, startedAt: exerciseStartedAt })
  }

  async function handleNext() {
    if (session.isComplete && user && exercises) {
      await finishSession()
      setView('summary')
    }
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
  }

  async function finishSession() {
    if (!user) return
    const answers = session.answers
    const correct = answers.filter(a => a.isCorrect).length

    await saveAnswers(user.id, answers)

    const baseProgress: UserSoundProgress = currentProgress ?? {
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

    const sessionIsCorrect = correct >= Math.ceil(answers.length / 2)
    const sr = updateSR(baseProgress, sessionIsCorrect)
    setNextReview(sr.next_review)

    await updateProgress(user.id, soundId, correct, answers.length, sr)

    const updatedProgress: UserSoundProgress = {
      ...baseProgress,
      total_attempts: baseProgress.total_attempts + answers.length,
      correct_answers: baseProgress.correct_answers + correct,
      streak: sr.streak,
    }
    if (isMastered(updatedProgress)) {
      await markMastered(user.id, soundId)
      const allProgress = await getAllProgress(user.id)
      const allSoundIds = allProgress.map(p => p.sound_id).sort((a, b) => a - b)
      const nextId = getNextUnlockedSoundId(allProgress, allSoundIds)
      if (nextId) await unlockNextSound(user.id, nextId)
    }
  }

  async function handleBackToLobby() {
    setView('lobby')
    setExercises(null)
    setActiveStage(null)
    await loadLobby()
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <p className="text-error">{error}</p>
          <button
            onClick={() => { setError(null); loadLobby() }}
            className="px-4 py-2 rounded-lg text-white"
            style={{
              backgroundColor: 'var(--primary)',
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!sessionData || !mastery) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--text-tertiary)]">Loading…</div>
      </div>
    )
  }

  if (view === 'summary' && exercises) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <SessionSummary
          answers={session.answers}
          soundIpa={sessionData.sound.ipa}
          nextReview={nextReview}
          onPracticeAgain={handleBackToLobby}
        />
      </div>
    )
  }

  if (view === 'session' && exercises) {
    const ex = session.currentExercise
    // After the last exercise is answered, ex is null but feedback is still visible.
    // Don't return null until the user acknowledges the feedback.
    if (!ex && !currentFeedback) return null

    const isLastExercise = session.isComplete
    const displayType = ex?.type ?? session.answers[session.answers.length - 1]?.exerciseType ?? 'pick_word'
    const displayIndex = Math.min(session.currentIndex, session.total)

    function renderExercise() {
      if (!ex) return null
      const submitHandler = (isCorrect: boolean, userAnswer: string) =>
        handleAnswer(isCorrect, userAnswer)

      switch (ex.type) {
        case 'pick_word':
          return <PickWordExercise key={session.currentIndex} exercise={ex} onSubmit={submitHandler} />
        case 'pick_sound':
          return <PickSoundExercise key={session.currentIndex} exercise={ex} onSubmit={submitHandler} />
        case 'minimal_pair':
          return <MinimalPairExercise key={session.currentIndex} exercise={ex} onSubmit={submitHandler} />
        case 'dictation':
          return <DictationExercise key={session.currentIndex} exercise={ex} onSubmit={submitHandler} />
      }
    }

    return (
      <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <button
            onClick={handleBackToLobby}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            ← Back
          </button>

          <ExerciseCard
            current={displayIndex}
            total={session.total}
            exerciseType={displayType}
            feedback={currentFeedback}
            onNext={currentFeedback ? handleNext : undefined}
            finishLabel={isLastExercise}
          >
            {renderExercise()}
          </ExerciseCard>
        </div>
      </div>
    )
  }

  // Lobby view
  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          ← Back
        </button>

        <StageLobby
          soundIpa={sessionData.sound.ipa}
          soundName={sessionData.sound.example ?? sessionData.sound.ipa}
          mastery={mastery}
          hasPairs={sessionData.pairs.length > 0}
          onSelectStage={handleSelectStage}
        />
      </div>
    </div>
  )
}
