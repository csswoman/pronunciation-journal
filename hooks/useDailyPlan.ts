'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { buildDailyPlan, DAILY_PLAN_STEP_COUNT } from '@/lib/practice/daily-plan'
import type { DailyPlan, DailyStep } from '@/lib/practice/types'

/** Mini-lección del día para el paso 'concept' (inyectada por el server). */
export interface ConceptLesson {
  slug: string
  title: string
  subtitle: string
}

function todayDateStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
}

/** Clave de localStorage para los pasos completados hoy (fecha local del cliente). */
function doneKey(userId: string): string {
  return `daily-done:${userId}:${todayDateStr()}`
}

/** Clave de localStorage para el plan serializado del día. */
function planKey(userId: string): string {
  return `daily-plan:${userId}:${todayDateStr()}`
}

function loadDoneIds(userId: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(doneKey(userId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveDoneIds(userId: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(doneKey(userId), JSON.stringify([...ids]))
  } catch {}
}

function loadCachedPlan(userId: string): DailyPlan | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(planKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as DailyPlan
  } catch {
    return null
  }
}

function savePlanToCache(userId: string, plan: DailyPlan): void {
  try {
    window.localStorage.setItem(planKey(userId), JSON.stringify(plan))
  } catch {}
}

export type DailyPlanStatus = 'idle' | 'loading' | 'ready' | 'error'

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

  // Keep a ref so `load` never changes identity when conceptLesson updates.
  const conceptLessonRef = useRef(conceptLesson)
  useEffect(() => { conceptLessonRef.current = conceptLesson }, [conceptLesson])

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
    setDoneIds(loadDoneIds(userId))
    setStatus('ready')
    return finalPlan
  }, [])

  const load = useCallback(async () => {
    if (!user) return
    setStatus('loading')
    try {
      const lesson = conceptLessonRef.current
      // Restaurar desde caché si el plan de hoy ya fue generado.
      const cached = loadCachedPlan(user.id)
      if (cached) {
        applyPlan(cached, lesson, user.id)
        return
      }
      const built = await buildDailyPlan(user.id)
      const finalPlan = applyPlan(built, lesson, user.id)
      savePlanToCache(user.id, finalPlan)
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
      // Si el paso es el primero que se completa hoy, también expande la card
      // (el usuario puede haber entrado a /daily directamente).
    },
    [user],
  )

  const steps = plan?.steps ?? []
  const completedCount = useMemo(
    () => steps.filter((s) => doneIds.has(s.id)).length,
    [steps, doneIds],
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
    completedCount,
    allDone,
    load,
    markDone,
    celebrate,
  } as const
}

export type { DailyStep }
