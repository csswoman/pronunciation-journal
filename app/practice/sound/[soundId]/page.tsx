'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import PageLayout from '@/components/layout/PageLayout'
import Button from '@/components/ui/Button'
import {
  getAllSounds,
  getAllWords,
  getMinimalPairs,
  getSoundById,
  updateProgress,
  markMastered,
  unlockNextSound,
  getAllProgress,
} from '@/lib/phoneme-practice/queries'
import { updateSR } from '@/lib/phoneme-practice/sr'
import { isMastered, getNextUnlockedSoundId } from '@/lib/phoneme-practice/mastery'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import { fromMixedExercise } from '@/lib/practice/adapters'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'
import type { UserSoundProgress } from '@/lib/phoneme-practice/types'

export default function SoundPracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const router = useRouter()
  const { user } = useAuth()

  const [soundIpa, setSoundIpa] = useState('')
  const [exercises, setExercises] = useState<PracticeExercise[]>([])
  const [progress, setProgress] = useState<UserSoundProgress | null>(null)
  const [nextReview, setNextReview] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  const loadAndStart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setNextReview(null)
    try {
      const [sound, allSounds, allWords, pairs, allProgress] = await Promise.all([
        getSoundById(soundId),
        getAllSounds(),
        getAllWords(),
        getMinimalPairs(soundId),
        getAllProgress(user.id),
      ])
      setSoundIpa(sound.ipa)
      setProgress(allProgress.find((p) => p.sound_id === soundId) ?? null)

      const targetWords = allWords.filter((w) => w.sound_id === soundId)
      const allWordsBySoundId = new Map(
        allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
      )
      const mixed = buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
      setExercises(mixed.map((m) => fromMixedExercise(m, 'sound_lab')))
      setSessionKey((k) => k + 1)
    } catch {
      setError('Failed to load. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [soundId, user])

  useEffect(() => {
    loadAndStart()
  }, [loadAndStart])

  const handleSessionComplete = useCallback(
    async (result: SessionResult) => {
      if (!user || result.results.length === 0) return

      const correct = result.results.filter((r) => r.isCorrect).length
      const total = result.results.length

      const base: UserSoundProgress = progress ?? {
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

      const sessionPassed = correct >= Math.ceil(total / 2)
      const sr = updateSR(base, sessionPassed)

      setNextReview(sr.next_review)

      try {
        await updateProgress(user.id, soundId, correct, total, sr)
      } catch (err) {
        console.error('[SoundPracticePage] updateProgress failed', err)
      }

      const updated: UserSoundProgress = {
        ...base,
        total_attempts: base.total_attempts + total,
        correct_answers: base.correct_answers + correct,
        streak: sr.streak,
      }

      if (isMastered(updated)) {
        try {
          await markMastered(user.id, soundId)
          const allProg = await getAllProgress(user.id)
          const nextId = getNextUnlockedSoundId(
            allProg,
            allProg.map((p) => p.sound_id).sort((a, b) => a - b),
          )
          if (nextId) await unlockNextSound(user.id, nextId)
        } catch (err) {
          console.error('[SoundPracticePage] mastery/unlock failed', err)
        }
      }
    },
    [user, progress, soundId],
  )

  const sessionConfig = useMemo(() => {
    if (exercises.length === 0 || !user) return null
    return {
      context: 'sound_lab' as const,
      exercises,
      sessionLength: exercises.length,
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push('/practice'),
    }
  }, [exercises, handleSessionComplete, router, user])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="space-y-3 text-center">
          <p className="text-error">{error}</p>
          <Button type="button" onClick={loadAndStart} variant="primary" size="sm">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !sessionConfig) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Loading…</div>
      </div>
    )
  }

  const header = (
    <header className="sticky top-0 z-10 border-b border-[var(--border-subtle)] bg-[var(--surface-base)]">
      <div className="flex items-center justify-between px-10 pt-6">
        <button
          type="button"
          onClick={() => router.push('/practice')}
          className="border-none bg-transparent p-1 text-[22px] leading-none text-fg-subtle"
        >
          ←
        </button>
        <div className="text-center">
          <div
            className="text-[30px] font-bold leading-none tracking-[-0.5px] text-primary"
            style={{ fontFamily: 'var(--font-phoneme), serif' }}
          >
            {soundIpa}
          </div>
        </div>
        <div className="w-6" />
      </div>
    </header>
  )

  return (
    <PageLayout variant="lesson" hero={header}>
      <main className="animate-fadeIn flex w-full items-center justify-center px-10 py-10">
        <PracticeSession key={sessionKey} {...sessionConfig} />
      </main>
      {nextReview && (
        <p className="pb-8 text-center text-xs text-fg-subtle">
          Next review: {nextReview.toLocaleDateString()}
        </p>
      )}
    </PageLayout>
  )
}
