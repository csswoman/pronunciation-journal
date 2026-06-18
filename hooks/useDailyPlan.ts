'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  loadCachedDailyPlan,
  loadDoneIds,
  loadResolvedIds,
  saveCachedDailyPlan,
  saveDoneIds,
  saveResolvedIds,
} from '@/lib/daily/plan-storage'
import { syncTodayReconciledSteps } from '@/lib/progress/activity-queries-client'
import { buildDailyPlan, DAILY_PLAN_STEP_COUNT } from '@/lib/practice/daily-plan'
import type { DailyPlan, DailyStep } from '@/lib/practice/types'

/** Mini-lección del día para el paso 'concept' (inyectada por el server). */
export interface ConceptLesson {
  slug: string
  title: string
  subtitle: string
}

export type DailyPlanStatus = 'idle' | 'loading' | 'ready' | 'error'

export type DailyStepStatus = 'pending' | 'done' | 'resolved'

interface UseDailyPlanOptions {
  conceptLesson: ConceptLesson | null
  /** Si true, genera el plan al montar. Si false, espera a `load()` (lazy). */
  autoLoad?: boolean
}

/**
 * Estado compartido de la diaria de 5 pasos: genera el plan en el cliente
 * (usa el navegador de Supabase), le añade el paso 'concept' del día, recuerda
 * los pasos hechos hoy en localStorage y dispara confetti al completarlos.
 *
 * El plan generado se persiste en localStorage con clave de fecha: si el usuario
 * recarga la página el mismo día, se restaura el plan ya generado sin volver a
 * llamar a buildDailyPlan. Al día siguiente la clave cambia y se genera uno nuevo.
 *
 * Consumido tanto por la página /daily (autoLoad) como por el checklist
 * embebido en el home (lazy, al pulsar "Empezar plan de hoy").
 */
export function useDailyPlan({ conceptLesson, autoLoad = true }: UseDailyPlanOptions) {
  const { user } = useAuth()

  const [plan, setPlan] = useState<DailyPlan | null>(null)
  const [status, setStatus] = useState<DailyPlanStatus>(autoLoad ? 'loading' : 'idle')
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set())
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  const conceptLessonRef = useRef(conceptLesson)
  useEffect(() => { conceptLessonRef.current = conceptLesson }, [conceptLesson])

  const hydrateStepIds = useCallback(async (userId: string) => {
    setDoneIds(loadDoneIds(userId))
    const merged = await syncTodayReconciledSteps(userId)
    setResolvedIds(merged)
  }, [])

  const applyPlan = useCallback((built: DailyPlan, lesson: ConceptLesson | null, userId: string) => {
    const steps = [...built.steps]
    if (lesson) {
      steps.push({
        kind: 'concept',
        id: `concept:${lesson.slug}`,
        title: lesson.title,
        subtitle: lesson.subtitle,
        icon: 'GraduationCap',
        exercises: [],
        estMinutes: 2,
        href: `/mini-lessons/${lesson.slug}`,
      })
    }
    const finalPlan = { ...built, steps: steps.slice(0, DAILY_PLAN_STEP_COUNT) }
    setPlan(finalPlan)
    void hydrateStepIds(userId)
    setStatus('ready')
    return finalPlan
  }, [hydrateStepIds])

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    try {
      const lesson = conceptLessonRef.current
      const cached = loadCachedDailyPlan(user.id)
      if (cached) {
        applyPlan(cached, lesson, user.id)
        return
      }
      const built = await buildDailyPlan(user.id)
      const finalPlan = applyPlan(built, lesson, user.id)
      saveCachedDailyPlan(user.id, finalPlan)
    } catch {
      setStatus('error')
    }
  }, [user, applyPlan])

  useEffect(() => {
    if (autoLoad) load()
  }, [autoLoad, load])

  const markDone = useCallback(
    (stepId: string) => {
      if (!user) return
      setDoneIds((prev) => {
        const next = new Set(prev)
        next.add(stepId)
        saveDoneIds(user.id, next)
        return next
      })
      setResolvedIds((prev) => {
        if (!prev.has(stepId)) return prev
        const next = new Set(prev)
        next.delete(stepId)
        saveResolvedIds(user.id, next)
        return next
      })
    },
    [user],
  )

  const getStepStatus = useCallback(
    (stepId: string): DailyStepStatus => {
      if (doneIds.has(stepId)) return 'done'
      if (resolvedIds.has(stepId)) return 'resolved'
      return 'pending'
    },
    [doneIds, resolvedIds],
  )

  const steps = plan?.steps ?? []
  const completedCount = useMemo(
    () => steps.filter((s) => doneIds.has(s.id) || resolvedIds.has(s.id)).length,
    [steps, doneIds, resolvedIds],
  )
  const allDone = steps.length > 0 && completedCount >= steps.length

  const celebrate = useCallback(() => {
    void import('canvas-confetti').then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#7c5cff', '#22c55e', '#f59e0b'],
      })
    })
  }, [])

  return {
    plan,
    status,
    steps,
    doneIds,
    resolvedIds,
    getStepStatus,
    completedCount,
    allDone,
    load,
    markDone,
    celebrate,
  } as const
}

export type { DailyStep }
