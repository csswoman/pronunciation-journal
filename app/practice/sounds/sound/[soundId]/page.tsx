'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { SessionLoadingShell } from '@/components/practice/session/SessionLoadingShell'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import Button from '@/components/ui/Button'
import {
  getAllSounds,
  getAllWords,
  getContrastProgress,
  getMinimalPairs,
  getSoundById,
} from '@/lib/phoneme-practice/queries'
import { finishContrastSession } from '@/lib/phoneme-practice/finish-session'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import { fromMixedExercise } from '@/lib/practice/adapters'
import { PHONEME_CONFUSION, contrastKey } from '@/lib/phoneme-practice/phoneme-similarity'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'

/** Derives the primary contrast id for a given sound IPA. */
function primaryContrastId(ipa: string): string | null {
  const confusables = PHONEME_CONFUSION[ipa]
  if (!confusables || confusables.length === 0) return null
  return contrastKey(ipa, confusables[0])
}

export default function SoundPracticePage() {
  const params = useParams()
  const soundId = Number(params.soundId)
  const router = useRouter()
  const { user } = useAuth()

  const [soundIpa, setSoundIpa] = useState('')
  const [exercises, setExercises] = useState<PracticeExercise[]>([])
  const [nextReview, setNextReview] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sessionKey, setSessionKey] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)

  const loadAndStart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setNextReview(null)
    try {
      const [sound, allSounds, allWords, pairs] = await Promise.all([
        getSoundById(soundId),
        getAllSounds(),
        getAllWords(),
        getMinimalPairs(soundId),
      ])
      setSoundIpa(sound.ipa)

      const cid = primaryContrastId(sound.ipa)
      if (cid) {
        const progress = await getContrastProgress(user.id, cid)
        setShowIntro(!progress || progress.total_attempts === 0)
      } else {
        setShowIntro(false)
      }

      const targetWords = allWords.filter((w) => w.sound_id === soundId)
      const allWordsBySoundId = new Map(
        allSounds.map((s) => [s.id, allWords.filter((w) => w.sound_id === s.id)]),
      )
      const mixed = buildMixedSession(sound, targetWords, allSounds, allWordsBySoundId, pairs)
      setExercises(mixed.map((m) => fromMixedExercise(m, 'sound_lab')))
      setSessionKey((k) => k + 1)
    } catch {
      setError('No se pudo cargar la sesión. Inténtalo de nuevo.')
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
      const cid = primaryContrastId(soundIpa)
      if (!cid) return
      try {
        const outcome = await finishContrastSession(user.id, cid, result)
        setNextReview(outcome.nextReview)
      } catch (err) {
        console.error('[SoundPracticePage] finishContrastSession failed', err)
      }
    },
    [user, soundIpa],
  )

  const sessionConfig = useMemo(() => {
    if (exercises.length === 0 || !user) return null
    return {
      context: 'sound_lab' as const,
      exercises,
      sessionLength: exercises.length,
      soundIpa,
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push('/practice/sounds'),
      persistence: { userId: user.id, soundId },
    }
  }, [exercises, handleSessionComplete, router, user, soundId, soundIpa])

  if (error) {
    return (
      <div className="phoneme-focus">
        <div className="space-y-3 text-center">
          <p className="text-error">{error}</p>
          <Button type="button" onClick={loadAndStart} variant="primary" size="sm">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !sessionConfig) {
    return (
      <div className="phoneme-focus">
        <SessionLoadingShell
          focusUi={!!soundIpa}
          displayBadge={soundIpa}
          onExit={() => router.push('/practice/sounds')}
        />
      </div>
    )
  }

  if (showIntro) {
    return (
      <div className="phoneme-focus">
        <div className="phoneme-focus__wrap">
          <div className="phoneme-focus__phone">
            <div className="phoneme-focus__topbar">
              <button
                type="button"
                className="phoneme-focus__exit"
                onClick={() => router.push('/practice/sounds')}
                aria-label="Salir de la práctica"
              >
                ✕
              </button>
            </div>
            <div className="phoneme-focus__stage overflow-y-auto">
              <PhonemeLessonIntro ipa={soundIpa} onStart={() => setShowIntro(false)} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const lessonFooter = soundIpa ? (
    <div className="border-t border-border-subtle px-4 py-2.5">
      <button
        type="button"
        onClick={() => setLessonOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-fg-subtle transition-colors hover:text-fg-secondary"
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M2 4h12M2 8h8M2 12h10" />
        </svg>
        Ver lección del sonido
      </button>
    </div>
  ) : undefined

  return (
    <>
      <PracticeSession key={sessionKey} {...sessionConfig} footer={lessonFooter} />

      {lessonOpen && soundIpa && (
        <div className="phoneme-focus fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="phoneme-focus__wrap">
            <div className="phoneme-focus__phone">
              <div className="phoneme-focus__topbar">
                <button
                  type="button"
                  className="phoneme-focus__exit"
                  onClick={() => setLessonOpen(false)}
                  aria-label="Cerrar lección"
                >
                  ✕
                </button>
              </div>
              <div className="phoneme-focus__stage overflow-y-auto">
                <PhonemeLessonIntro ipa={soundIpa} onStart={() => setLessonOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}

      {nextReview && (
        <p className="pb-6 text-center text-xs text-fg-subtle">
          Próxima revisión: {nextReview.toLocaleDateString()}
        </p>
      )}
    </>
  )
}
