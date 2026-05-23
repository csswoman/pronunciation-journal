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
  getAllProgress,
} from '@/lib/phoneme-practice/queries'
import { finishPhonemeSession } from '@/lib/phoneme-practice/finish-session'
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
      try {
        const outcome = await finishPhonemeSession(user.id, soundId, result, progress)
        setNextReview(outcome.nextReview)
      } catch (err) {
        console.error('[SoundPracticePage] finishPhonemeSession failed', err)
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
      persistence: { userId: user.id, soundId },
    }
  }, [exercises, handleSessionComplete, router, user, soundId])

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
          className="border-none bg-transparent p-1 text-xl leading-none text-fg-subtle"
        >
          ←
        </button>
        <div className="text-center">
          <div
            className="text-3xl font-bold leading-none tracking-[-0.5px] text-primary"
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
