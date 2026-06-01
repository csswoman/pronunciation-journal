'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import PracticeSession from '@/components/practice/PracticeSession'
import Button from '@/components/ui/Button'
import { buildDailyPlan, EmptyWordBankError } from '@/lib/practice/daily-plan'
import type { PracticeExercise, SessionResult } from '@/lib/practice/types'

export default function DailyPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [exercises, setExercises] = useState<PracticeExercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [emptyWordBank, setEmptyWordBank] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [finalResult, setFinalResult] = useState<SessionResult | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    setEmptyWordBank(false)
    setCompleted(false)
    setFinalResult(null)
    try {
      const plan = await buildDailyPlan(user.id)
      setExercises(plan)
      setSessionKey((k) => k + 1)
    } catch (err) {
      if (err instanceof EmptyWordBankError) {
        setEmptyWordBank(true)
      } else {
        setError('No se pudo cargar el plan de hoy. Inténtalo de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const handleSessionComplete = useCallback((result: SessionResult) => {
    setCompleted(true)
    setFinalResult(result)
  }, [])

  const sessionConfig = useMemo(() => {
    if (exercises.length === 0 || !user) return null
    return {
      context: 'daily' as const,
      exercises,
      sessionLength: exercises.length,
      sessionLabel: 'Hoy',
      onSessionComplete: handleSessionComplete,
      onExit: () => router.push('/'),
    }
  }, [exercises, handleSessionComplete, router, user])

  if (emptyWordBank) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm space-y-4 text-center">
          <p className="text-base text-fg-secondary">
            Tu banco de palabras está vacío. Añade palabras desde el léxico para desbloquear la práctica
            diaria.
          </p>
          <Button type="button" variant="primary" size="md" onClick={() => router.push('/words?tab=lexicon')}>
            Ir al léxico
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="text-error">{error}</p>
          <Button type="button" variant="primary" size="sm" onClick={load}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  if (loading || !sessionConfig) {
    return (
      <div className="phoneme-focus flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Preparando el plan de hoy…</div>
      </div>
    )
  }

  return (
    <>
      <PracticeSession key={sessionKey} {...sessionConfig} />
      {completed && finalResult && (
        <p className="pb-6 text-center text-xs text-fg-subtle">
          {finalResult.accuracy}% de aciertos · {finalResult.results.length} ejercicios
        </p>
      )}
    </>
  )
}
