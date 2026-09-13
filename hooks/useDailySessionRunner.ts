'use client'

import { useCallback, useRef, useState } from 'react'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'
import { isOptionalLinkStep } from '@/lib/practice/daily-plan/step-completion'

export const DAILY_STEP_STORAGE_KEY = 'daily:step'

export function readStepStorage(): { stepId: string; exerciseIndex: number } | null {
  try {
    const raw = sessionStorage.getItem(DAILY_STEP_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { stepId: string; exerciseIndex: number }
  } catch {
    return null
  }
}

export function writeStepStorage(stepId: string, exerciseIndex: number): void {
  try {
    sessionStorage.setItem(
      DAILY_STEP_STORAGE_KEY,
      JSON.stringify({ stepId, exerciseIndex }),
    )
  } catch {
    /* ignore quota errors */
  }
}

export function clearStepStorage(): void {
  try {
    sessionStorage.removeItem(DAILY_STEP_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export type SessionView =
  | { mode: 'idle' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }

export interface UseDailySessionRunnerOptions {
  steps: DailyStep[]
  markDone: (stepId: string) => Promise<void>
  allDone?: boolean
  getStepStatus?: (stepId: string) => DailyStepStatus
}

/**
 * Orquestador de la sesión diaria: desacopla el avance de pasos del router de Next.js.
 * Consumido por /daily (DailyChecklist) y por Home (HomeLayout).
 *
 * Mantiene la máquina de estados view (idle -> step -> done) en el cliente,
 * gestiona sessionStorage para reanudación de ejercicios y busca automáticamente
 * el siguiente paso pendiente al completar el actual.
 */
export function useDailySessionRunner({
  steps,
  markDone,
  getStepStatus,
}: UseDailySessionRunnerOptions) {
  const [view, setView] = useState<SessionView>({ mode: 'idle' })
  const [sessionKey, setSessionKey] = useState(0)
  const autoStartedRef = useRef(false)

  const startStep = useCallback((step: DailyStep, exerciseIndex: number = 0) => {
    if (isOptionalLinkStep(step)) return
    writeStepStorage(step.id, exerciseIndex)
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex })
  }, [])

  const completeStep = useCallback(
    async (stepId: string) => {
      clearStepStorage()
      await markDone(stepId)

      // Busca el siguiente paso pendiente ejecutable
      const nextStep = steps.find((s) => {
        if (s.id === stepId) return false
        if (isOptionalLinkStep(s)) return false
        if (getStepStatus) {
          const st = getStepStatus(s.id)
          return st !== 'done' && st !== 'resolved'
        }
        return true
      })

      if (nextStep) {
        setSessionKey((k) => k + 1)
        setView({ mode: 'step', step: nextStep, exerciseIndex: 0 })
      } else {
        setView({ mode: 'done' })
      }
    },
    [steps, markDone, getStepStatus],
  )

  const exitStep = useCallback(() => {
    clearStepStorage()
    setView({ mode: 'idle' })
  }, [])

  const resumeFromUrlStep = useCallback(
    (stepId: string | undefined) => {
      if (!stepId || autoStartedRef.current) return
      const step = steps.find((s) => s.id === stepId)
      if (!step || isOptionalLinkStep(step)) return
      autoStartedRef.current = true
      const stored = readStepStorage()
      const exerciseIndex =
        stored?.stepId === stepId ? (stored.exerciseIndex ?? 0) : 0
      setSessionKey((k) => k + 1)
      setView({ mode: 'step', step, exerciseIndex })
    },
    [steps],
  )

  return {
    view,
    sessionKey,
    startStep,
    completeStep,
    exitStep,
    resumeFromUrlStep,
    setView,
  }
}
