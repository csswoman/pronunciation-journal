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
import type { StageId, StageMasteryMap } from '@/lib/phoneme-practice/stages'
import type { Exercise, UserSoundProgress, Sound, SoundWord, MinimalPair } from '@/lib/phoneme-practice/types'

interface SessionData {
  sound: Sound
  allSounds: Sound[]
  allWordsBySoundId: Map<number, SoundWord[]>
  targetWords: SoundWord[]
  pairs: MinimalPair[]
}

const EXERCISE_LABELS: Record<string, string> = {
  pick_word:    'Pick the Word',
  pick_sound:   'Pick the Sound',
  minimal_pair: 'Minimal Pairs',
  dictation:    'Dictation',
  speak_word:   'Speak It',
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
    const isLast = session.currentQueuePos + 1 >= session.queueLength
    session.advance()
    if (isLast && user && exercises) {
      await finishSession()
      setShowSummary(true)
    }
  }

  async function handleSkip() {
    if (currentFeedback) { handleNext(); return }
    setCurrentFeedback(null)
    setExerciseStartedAt(Date.now())
    const isLast = session.currentQueuePos + 1 >= session.queueLength
    session.advance()
    if (isLast && user && exercises) {
      await finishSession()
      setShowSummary(true)
    }
  }

  async function finishSession() {
    if (!user) return
    await saveAnswers(user.id, session.answers)

    const scoreCorrect = session.scoreableCorrect
    const total = session.originalTotal
    const base: UserSoundProgress = currentProgress ?? {
      id: '', user_id: user.id, sound_id: soundId, status: 'available',
      total_attempts: 0, correct_answers: 0, streak: 0, best_streak: 0,
      last_practiced: null, next_review: null, ease_factor: 2.5, interval_days: 1,
    }
    const sr = updateSR(base, scoreCorrect >= Math.ceil(total / 2))
    setNextReview(sr.next_review)
    await updateProgress(user.id, soundId, scoreCorrect, total, sr)

    const updated: UserSoundProgress = {
      ...base, total_attempts: base.total_attempts + total,
      correct_answers: base.correct_answers + scoreCorrect, streak: sr.streak,
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
        soundIpa={sessionData.sound.ipa}
        scoreableCorrect={session.scoreableCorrect}
        originalTotal={session.originalTotal}
        nextReview={nextReview}
        onPracticeAgain={loadAndStart}
      />
    </div>
  )

  const ex = session.currentExercise
  const isLast = session.currentQueuePos + 1 >= session.queueLength
  const displayType = ex?.type ?? session.answers[session.answers.length - 1]?.exerciseType ?? 'pick_word'
  const pct = session.originalTotal > 0 ? (session.completedCount / session.originalTotal) * 100 : 0

  function renderExercise() {
    if (!ex) return null
    const submit = (ok: boolean, ans: string) => handleAnswer(ok, ans)
    switch (ex.type) {
      case 'pick_word':    return <PickWordExercise    key={session.currentQueuePos} exercise={ex} onSubmit={submit} />
      case 'pick_sound':   return <PickSoundExercise   key={session.currentQueuePos} exercise={ex} onSubmit={submit} />
      case 'minimal_pair': return <MinimalPairExercise key={session.currentQueuePos} exercise={ex} onSubmit={submit} />
      case 'dictation':    return <DictationExercise   key={session.currentQueuePos} exercise={ex} onSubmit={submit} />
      case 'speak_word':   return <SpeakExercise       key={session.currentQueuePos} exercise={ex} onSubmit={submit} />
    }
  }

  const header = (
    <header
      className="sticky top-0 z-10 border-b"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface-base)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px 0' }}>
        <button
          type="button"
          onClick={() => router.push('/practice')}
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 22, cursor: 'pointer', lineHeight: 1, padding: 4 }}
        >
          ←
        </button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-phoneme), serif', fontSize: 30, fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {sessionData.sound.ipa}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {session.completedCount} / {session.originalTotal}
          </p>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
          background: 'var(--accent-dim)', color: 'var(--primary)',
          borderRadius: 'var(--radius-full)', padding: '5px 14px',
        }}>
          {EXERCISE_LABELS[displayType] ?? displayType}
        </div>
      </div>
      <div style={{ height: 3, background: 'var(--border-subtle)', margin: '18px 40px 12px', borderRadius: 99, overflow: 'hidden' }}>
        <div
          style={{ height: '100%', borderRadius: 99, background: 'var(--gradient-primary)', width: `${pct}%`, transition: 'width .4s ease' }}
        />
      </div>
    </header>
  )

  return (
    <PageLayout variant="lesson" hero={header}>
      <main
        key={session.currentQueuePos}
        className="animate-fadeIn flex w-full items-center justify-center"
        style={{ padding: '40px 40px 24px' }}
      >
        <div className="w-full max-w-md">
          <ExerciseCard
            exerciseType={displayType}
            feedback={currentFeedback}
            onNext={currentFeedback ? handleNext : undefined}
            finishLabel={isLast}
          >
            {renderExercise()}
          </ExerciseCard>
        </div>
      </main>

      <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 40px 32px' }}>
        <button
          type="button"
          onClick={handleSkip}
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer', letterSpacing: '.03em', fontFamily: 'inherit' }}
        >
          Skip
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Array.from({ length: Math.min(session.originalTotal, 12) }).map((_, i) => {
            const done = i < session.completedCount
            const active = i === session.completedCount
            return (
              <div
                key={i}
                style={{
                  width: active ? 20 : 7,
                  height: 7,
                  borderRadius: 'var(--radius-full)',
                  background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border-subtle)',
                  transition: 'all .3s ease',
                }}
              />
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleSkip}
          style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer', letterSpacing: '.03em', fontFamily: 'inherit' }}
        >
          I know this →
        </button>
      </footer>
    </PageLayout>
  )
}
