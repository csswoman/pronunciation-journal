'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from "@/components/auth/AuthProvider"
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { PickWordExercise } from '@/components/phoneme-practice/PickWordExercise'
import { PickSoundExercise } from '@/components/phoneme-practice/PickSoundExercise'
import { MinimalPairExercise } from '@/components/phoneme-practice/MinimalPairExercise'
import { DictationExercise } from '@/components/phoneme-practice/DictationExercise'
import { SpeakExercise } from '@/components/phoneme-practice/SpeakExercise'
import { MatchPairsExercise } from '@/components/exercises/MatchPairsExercise'
import { SessionSummary } from '@/components/phoneme-practice/SessionSummary'
import {
  getAllSounds, getAllWords, getMinimalPairs, getSoundById,
  saveAnswers, updateProgress, markMastered, unlockNextSound, getAllProgress,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { isMastered, getNextUnlockedSoundId } from '@/lib/phoneme-practice/mastery'
import { buildMixedSession, type MixedExercise } from '@/lib/phoneme-practice/mixed-session'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import type { SessionAnswer, UserSoundProgress } from '@/lib/phoneme-practice/types'

const EXERCISE_LABELS: Record<string, string> = {
  pick_word:    'Pick the Word',
  pick_sound:   'Pick the Sound',
  minimal_pair: 'Minimal Pairs',
  dictation:    'Dictation',
  speak_word:   'Speak It',
  match_pairs:  'Match Pairs',
}

export default function SoundPracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const router = useRouter()
  const { user } = useAuth()

  const [soundIpa, setSoundIpa] = useState('')
  const [exercises, setExercises] = useState<MixedExercise[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<SessionAnswer[]>([])
  const [feedback, setFeedback] = useState<{ isCorrect: boolean } | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [nextReview, setNextReview] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const startedAt = useRef(Date.now())
  const progressRef = useRef<UserSoundProgress | null>(null)

  const loadAndStart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setShowSummary(false)
    setIndex(0)
    setAnswers([])
    setFeedback(null)
    setError(null)
    try {
      const [sound, allSounds, allWords, pairs, allProgress] = await Promise.all([
        getSoundById(soundId), getAllSounds(), getAllWords(),
        getMinimalPairs(soundId), getAllProgress(user.id),
      ])
      setSoundIpa(sound.ipa)
      progressRef.current = allProgress.find(p => p.sound_id === soundId) ?? null

      const targetWords = allWords.filter(w => w.sound_id === soundId)
      const allWordsBySoundId = new Map(
        allSounds.map(s => [s.id, allWords.filter(w => w.sound_id === s.id)])
      )
      setExercises(buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs))
      startedAt.current = Date.now()
    } catch {
      setError('Failed to load. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [soundId, user])

  useEffect(() => { loadAndStart() }, [loadAndStart])

  function handleSubmit(isCorrect: boolean, userAnswer: string) {
    setFeedback({ isCorrect })
    const current = exercises[index]
    if (current.kind === 'phoneme') {
      setAnswers(prev => [...prev, {
        soundId,
        exerciseType: current.data.type,
        isCorrect,
        userAnswer,
        targetWord: current.data.targetWord,
        timeMs: Date.now() - startedAt.current,
        exercisePayload: { type: current.data.type, soundId, options: current.data.options },
      }])
    }
  }

  async function advance() {
    setFeedback(null)
    startedAt.current = Date.now()
    if (index + 1 >= exercises.length) {
      setShowSummary(true)
      await finishSession()
    } else {
      setIndex(i => i + 1)
    }
  }

  async function handleNext() { await advance() }
  async function handleSkip() {
    if (feedback) { await advance(); return }
    await advance()
  }

  async function finishSession() {
    if (!user || answers.length === 0) return
    await saveAnswers(user.id, answers)

    const correct = answers.filter(a => a.isCorrect).length
    const total = answers.length
    const base: UserSoundProgress = progressRef.current ?? {
      id: '', user_id: user.id, sound_id: soundId, status: 'available',
      total_attempts: 0, correct_answers: 0, streak: 0, best_streak: 0,
      last_practiced: null, next_review: null, ease_factor: 2.5, interval_days: 1,
    }
    const sr = updateSR(base, correct >= Math.ceil(total / 2))
    setNextReview(sr.next_review)
    await updateProgress(user.id, soundId, correct, total, sr)

    const updated: UserSoundProgress = {
      ...base,
      total_attempts: base.total_attempts + total,
      correct_answers: base.correct_answers + correct,
      streak: sr.streak,
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
        <Button type="button" onClick={loadAndStart} variant="primary" size="sm">Retry</Button>
      </div>
    </div>
  )

  if (loading || exercises.length === 0) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-fg-subtle">Loading…</div>
    </div>
  )

  if (showSummary) return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SessionSummary
        soundIpa={soundIpa}
        scoreableCorrect={answers.filter(a => a.isCorrect).length}
        originalTotal={answers.length}
        nextReview={nextReview}
        onPracticeAgain={loadAndStart}
      />
    </div>
  )

  const current = exercises[index]
  const isLast = index + 1 >= exercises.length
  const pct = exercises.length > 0 ? (index / exercises.length) * 100 : 0
  const displayLabel = current.kind === 'match_pairs'
    ? 'Match Pairs'
    : (EXERCISE_LABELS[current.data.type] ?? current.data.type)

  function renderExercise() {
    const submit = (ok: boolean, ans: string) => handleSubmit(ok, ans)
    if (current.kind === 'match_pairs') {
      return <MatchPairsExercise key={index} exercise={current.data} onSubmit={submit} />
    }
    const ex = current.data
    switch (ex.type) {
      case 'pick_word':    return <PickWordExercise    key={index} exercise={ex} onSubmit={submit} />
      case 'pick_sound':   return <PickSoundExercise   key={index} exercise={ex} onSubmit={submit} />
      case 'minimal_pair': return <MinimalPairExercise key={index} exercise={ex} onSubmit={submit} />
      case 'dictation':    return <DictationExercise   key={index} exercise={ex} onSubmit={submit} />
      case 'speak_word':   return <SpeakExercise       key={index} exercise={ex} onSubmit={submit} />
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
            {soundIpa}
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {index} / {exercises.length}
          </p>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase' as const,
          background: 'var(--accent-dim)', color: 'var(--primary)',
          borderRadius: 'var(--radius-full)', padding: '5px 14px',
        }}>
          {displayLabel}
        </div>
      </div>
      <div style={{ height: 3, background: 'var(--border-subtle)', margin: '18px 40px 12px', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: 'var(--gradient-primary)', width: `${pct}%`, transition: 'width .4s ease' }} />
      </div>
    </header>
  )

  return (
    <PageLayout variant="lesson" hero={header}>
      <main
        key={index}
        className="animate-fadeIn flex w-full items-center justify-center"
        style={{ padding: '40px 40px 24px' }}
      >
        <div className="w-full max-w-md">
          <ExerciseCard
            exerciseType={current.kind === 'match_pairs' ? 'match_pairs' : current.data.type}
            feedback={feedback}
            onNext={feedback ? handleNext : undefined}
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
          {Array.from({ length: Math.min(exercises.length, 12) }).map((_, i) => {
            const done = i < index
            const active = i === index
            return (
              <div key={i} style={{
                width: active ? 20 : 7, height: 7,
                borderRadius: 'var(--radius-full)',
                background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--border-subtle)',
                transition: 'all .3s ease',
              }} />
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
