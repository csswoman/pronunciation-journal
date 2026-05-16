'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from "@/components/auth/AuthProvider"
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import { usePracticeSession } from '@/hooks/usePracticeSession'
import { buildStageSession } from '@/lib/phoneme-practice/exercises'
import { STAGES, isStageUnlocked, computeStageMastery } from '@/lib/phoneme-practice/stages'
import {
  getAllSounds, getAllWords, getMinimalPairs, getSoundById,
  saveAnswers, updateProgress, markMastered, unlockNextSound,
  getAllProgress, getAnswerHistoryForSound,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { isMastered, getNextUnlockedSoundId } from '@/lib/phoneme-practice/mastery'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import { H1 } from '@/components/ui/Typography'
import type { StageId, StageMasteryMap } from '@/lib/phoneme-practice/stages'
import type { Exercise, UserSoundProgress, Sound, SoundWord, MinimalPair } from '@/lib/phoneme-practice/types'

interface SessionData {
  sound: Sound
  allSounds: Sound[]
  allWordsBySoundId: Map<number, SoundWord[]>
  targetWords: SoundWord[]
  pairs: MinimalPair[]
}

function pickStartStage(mastery: StageMasteryMap, hasPairs: boolean): StageId {
  const visible = hasPairs ? STAGES : STAGES.filter(s => s.id !== 'pairs')
  return visible.find(s => isStageUnlocked(s.id, mastery, hasPairs) && mastery[s.id].pct < 80)?.id ?? 'recognition'
}

export default function SoundPracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const router = useRouter()
  const { user } = useAuth()

  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [exercises, setExercises] = useState<Exercise[] | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFeedback, setCurrentFeedback] = useState<{ isCorrect: boolean } | null>(null)
  const [exerciseStartedAt, setExerciseStartedAt] = useState(Date.now())
  const [nextReview, setNextReview] = useState<Date | null>(null)
  const [currentProgress, setCurrentProgress] = useState<UserSoundProgress | null>(null)

  const loadAndStart = useCallback(async () => {
    if (!user) return
    setShowSummary(false)
    setExercises(null)
    setCurrentFeedback(null)
    try {
      const [sound, allSounds, allWords, pairs, history] = await Promise.all([
        getSoundById(soundId), getAllSounds(), getAllWords(),
        getMinimalPairs(soundId), getAnswerHistoryForSound(user.id, soundId),
      ])
      const targetWords = allWords.filter(w => w.sound_id === soundId)
      const allWordsBySoundId = new Map(allSounds.map(s => [s.id, allWords.filter(w => w.sound_id === s.id)]))
      const data: SessionData = { sound, allSounds, allWordsBySoundId, targetWords, pairs }
      setSessionData(data)

      const mastery = computeStageMastery(history)
      const stage = pickStartStage(mastery, pairs.length > 0)
      const exs = buildStageSession(stage, sound, targetWords, allSounds, allWordsBySoundId, pairs)
      setExercises(exs.length > 0 ? exs : null)
      setExerciseStartedAt(Date.now())

      const progress = await getAllProgress(user.id)
      setCurrentProgress(progress.find(r => r.sound_id === soundId) ?? null)
    } catch {
      setError('Failed to load. Please try again.')
    }
  }, [soundId, user])

  useEffect(() => { loadAndStart() }, [loadAndStart])

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
      setShowSummary(true)
    }
  }

  async function finishSession() {
    if (!user) return
    const answers = session.answers
    const correct = answers.filter(a => a.isCorrect).length
    await saveAnswers(user.id, answers)

    const base: UserSoundProgress = currentProgress ?? {
      id: '', user_id: user.id, sound_id: soundId, status: 'available',
      total_attempts: 0, correct_answers: 0, streak: 0, best_streak: 0,
      last_practiced: null, next_review: null, ease_factor: 2.5, interval_days: 1,
    }
    const sr = updateSR(base, correct >= Math.ceil(answers.length / 2))
    setNextReview(sr.next_review)
    await updateProgress(user.id, soundId, correct, answers.length, sr)

    const updated: UserSoundProgress = {
      ...base, total_attempts: base.total_attempts + answers.length,
      correct_answers: base.correct_answers + correct, streak: sr.streak,
    }
    if (isMastered(updated)) {
      await markMastered(user.id, soundId)
      const allProg = await getAllProgress(user.id)
      const nextId = getNextUnlockedSoundId(allProg, allProg.map(p => p.sound_id).sort((a, b) => a - b))
      if (nextId) await unlockNextSound(user.id, nextId)
    }
  }

  if (error) return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="space-y-3 text-center">
        <p className="text-error">{error}</p>
        <Button type="button" onClick={() => { setError(null); loadAndStart() }} variant="primary" size="sm">Retry</Button>
      </div>
    </div>
  )

  if (!sessionData || !exercises) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-fg-subtle">Loading…</div>
    </div>
  )

  if (showSummary) return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SessionSummary
        answers={session.answers}
        soundIpa={sessionData.sound.ipa}
        nextReview={nextReview}
        onPracticeAgain={loadAndStart}
      />
    </div>
  )

  const ex = session.currentExercise
  const isLast = session.currentIndex + 1 >= session.total
  const displayType = ex?.type ?? session.answers[session.answers.length - 1]?.exerciseType ?? 'pick_word'
  const displayIndex = Math.min(session.currentIndex, session.total)

  function renderExercise() {
    if (!ex) return null
    const submit = (ok: boolean, ans: string) => handleAnswer(ok, ans)
    switch (ex.type) {
      case 'pick_word':    return <PickWordExercise    key={session.currentIndex} exercise={ex} onSubmit={submit} />
      case 'pick_sound':   return <PickSoundExercise   key={session.currentIndex} exercise={ex} onSubmit={submit} />
      case 'minimal_pair': return <MinimalPairExercise key={session.currentIndex} exercise={ex} onSubmit={submit} />
      case 'dictation':    return <DictationExercise   key={session.currentIndex} exercise={ex} onSubmit={submit} />
      case 'speak_word':   return <SpeakExercise       key={session.currentIndex} exercise={ex} onSubmit={submit} />
    }
  }

  const header = (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-raised">
      <div className="px-6 py-4 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button type="button" onClick={() => router.push('/practice')} variant="ghost" size="icon" className="rounded-xl">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div className="text-center">
            <H1 className="font-heading text-lg font-semibold leading-tight tracking-tight text-primary">
              {sessionData.sound.ipa}
            </H1>
            <p className="text-caption leading-5 text-fg-muted">{displayIndex + 1} / {session.total}</p>
          </div>
          <div className="w-10" />
        </div>
        <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${((displayIndex + (currentFeedback ? 1 : 0)) / session.total) * 100}%` }}
          />
        </div>
      </div>
    </header>
  )

  return (
    <PageLayout variant="lesson" hero={header}>
      <main className="flex w-full items-center justify-center px-6 py-10 lg:px-8">
        <div className="w-full max-w-md space-y-4">
          <ExerciseCard
            key={session.currentIndex}
            current={displayIndex}
            total={session.total}
            exerciseType={displayType}
            feedback={currentFeedback}
            onNext={currentFeedback ? handleNext : undefined}
            finishLabel={isLast}
          >
            {renderExercise()}
          </ExerciseCard>
        </div>
      </main>
    </PageLayout>
  )
}
