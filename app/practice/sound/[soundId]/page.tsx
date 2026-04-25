'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from "@/components/auth/AuthProvider"
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { SoundLobby } from '@/components/phoneme-practice/SoundLobby'
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
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
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

export default function SoundPracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const { user } = useAuth()

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
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
    const isLast = session.currentIndex + 1 >= session.total
    session.advance()
    if (isLast && user && exercises) {
      await finishSession()
      setView('summary')
    }
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
          <Button
            type="button"
            onClick={() => { setError(null); loadLobby() }}
            variant="primary"
            size="sm"
            className="rounded-lg px-4 py-2 text-white"
          >
            Retry
          </Button>
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
    if (!ex && !currentFeedback) return null

    const isLastExercise = session.currentIndex + 1 >= session.total
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

    const sessionHeader = (
      <header
        className="sticky top-0 z-10 border-b"
        style={{
          background: 'linear-gradient(180deg, color-mix(in_oklch,var(--card-bg)_92%,white), var(--card-bg))',
          borderColor: 'var(--line-divider)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div className="px-6 py-4 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Button
              type="button"
              onClick={handleBackToLobby}
              variant="ghost"
              size="icon"
              className="rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            <div className="text-center">
              <h1 className="text-[18px] font-semibold leading-tight tracking-tight font-mono" style={{ color: 'var(--primary)' }}>
                {sessionData.sound.ipa}
              </h1>
              <p className="text-[13px] leading-5" style={{ color: 'var(--text-secondary)' }}>
                {displayIndex + 1} / {session.total}
              </p>
            </div>
            <div className="w-10" />
          </div>
          <div className="mt-4 w-full rounded-full h-3 overflow-hidden" style={{ backgroundColor: 'var(--line-divider)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                backgroundColor: 'var(--primary)',
                width: `${((displayIndex + (currentFeedback ? 1 : 0)) / session.total) * 100}%`,
              }}
            />
          </div>
        </div>
      </header>
    )

    return (
      <PageLayout variant="lesson" hero={sessionHeader}>
        <main className="py-10 px-6 w-full lg:px-8 flex items-center justify-center">
          <div className="w-full max-w-md space-y-4">
            <ExerciseCard
              key={session.currentIndex}
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
        </main>
      </PageLayout>
    )
  }

  // Lobby view
  return (
    <PageLayout variant="lesson">
      <SoundLobby
        soundIpa={sessionData.sound.ipa}
        soundName={sessionData.sound.example ?? sessionData.sound.ipa}
        soundType={sessionData.sound.type ?? undefined}
        mastery={mastery}
        hasPairs={sessionData.pairs.length > 0}
        onSelectStage={handleSelectStage}
        backHref="/practice"
      />
    </PageLayout>
  )
}
