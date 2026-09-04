'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import { SessionLoadingShell } from '@/components/practice/session/SessionLoadingShell'
import { PhonemeLessonIntro } from '@/components/phoneme-practice/PhonemeLessonIntro'
import Button from '@/components/ui/Button'
import {
  getAllContrastProgress,
  getSessionDataset,
} from '@/lib/phoneme-practice/queries'
import { finishAttributedContrastSessions } from '@/lib/phoneme-practice/finish-session'
import { buildMixedSession } from '@/lib/phoneme-practice/mixed-session'
import { fromMixedExercise } from '@/lib/practice/adapters'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'

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
  const [showIntro, setShowIntro] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)

  const loadAndStart = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setNextReview(null)
    try {
      const [dataset, allProgress] = await Promise.all([
        getSessionDataset(soundId),
        getAllContrastProgress(user.id),
      ])
      const { targetSound: sound, sounds, wordsBySoundId, minimalPairs } = dataset
      setSoundIpa(sound.ipa)

      // La introducción ya se presentó en el modal del fonema; ir directo a la práctica
      setShowIntro(false)

      const targetWords = wordsBySoundId.get(soundId) ?? []
      const mixed = buildMixedSession(sound, targetWords, sounds, wordsBySoundId, minimalPairs, {
        contrastProgress: allProgress,
      })
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
      try {
        // PracticeSession already records the activity_sessions row.
        // Plan 062: update each attributed contrast independently.
        const outcome = await finishAttributedContrastSessions(user.id, result)
        if (outcome.nextReview) setNextReview(outcome.nextReview)
      } catch (err) {
        console.error('[SoundPracticePage] finishAttributedContrastSessions failed', err)
      }
    },
    [user],
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
            <div className="phoneme-focus__stage phoneme-focus__stage--flush overflow-y-auto">
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
        className="flex w-full items-center justify-center gap-1.5 text-caption font-medium text-fg-subtle transition-colors hover:text-fg-secondary"
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
              <div className="phoneme-focus__stage phoneme-focus__stage--flush overflow-y-auto">
                <PhonemeLessonIntro
                  ipa={soundIpa}
                  onStart={() => setLessonOpen(false)}
                  startLabel="Volver a la práctica"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {nextReview && (
        <p className="pb-6 text-center text-caption text-fg-subtle">
          Próxima revisión: {nextReview.toLocaleDateString()}
        </p>
      )}
    </>
  )
}
