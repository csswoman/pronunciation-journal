'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { GraduationCap, Sparkles } from '@/components/icons'
import Button from '@/components/ui/Button'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import dynamic from 'next/dynamic'
import RecommendedPracticeCard from '@/components/practice/hub/RecommendedPracticeCard'
import { resolveRecommendedMode } from '@/lib/practice/practice-modes'
import SessionOpeningBanner from './SessionOpeningBanner'

const DailyStepSession = dynamic(() => import('./DailyStepSession'), {
  loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando sesión…</div>,
})
import SessionRecapCard from './SessionRecapCard'
import DailyLessonCard from './DailyLessonCard'
import StudyTipDisclosure from './StudyTipDisclosure'
import { ImmersionLogCard } from './ImmersionLogCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { fetchDueTomorrowCount } from '@/lib/review/client-queries'

export type { ConceptLesson }

// ── sessionStorage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = 'daily:step'

function readStepStorage(): { stepId: string; exerciseIndex: number } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as { stepId: string; exerciseIndex: number }
  } catch {
    return null
  }
}

function clearStepStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

// ── Types ───────────────────────────────────────────────────────────────────

interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
  initialStepId?: string
  /** Current streak in days, fetched server-side. null when unavailable. */
  streak?: number | null
}

type View =
  | { mode: 'checklist' }
  | { mode: 'step'; step: DailyStep; exerciseIndex: number }
  | { mode: 'done' }

// ── Component ───────────────────────────────────────────────────────────────

export default function DailyChecklist({ conceptLesson, initialStepId, streak = null }: DailyChecklistProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { plan, status, steps, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const [view, setView] = useState<View>({ mode: 'checklist' })
  const [sessionKey, setSessionKey] = useState(0)
  const [dueTomorrow, setDueTomorrow] = useState<number | null>(null)
  // Prevents double-triggering the initialStepId open-on-load (e.g. from a
  // notification link with ?step=). Doesn't auto-start anything else — the
  // learner picks a step from the checklist.
  const autoStartedRef = useRef(false)

  useEffect(() => {
    if (status !== 'ready' || autoStartedRef.current || !initialStepId) return
    const step = steps.find((s) => s.id === initialStepId)
    if (!step || step.kind === 'concept' || step.kind === 'study_deck' || step.kind === 'mission') return
    autoStartedRef.current = true
    const stored = readStepStorage()
    const exerciseIndex = stored?.stepId === initialStepId ? (stored.exerciseIndex ?? 0) : 0
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex })
  }, [status, steps, initialStepId])

  // Celebrate once when all steps are complete, and load the "due tomorrow" count.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
      if (user) {
        fetchDueTomorrowCount(user.id)
          .then(setDueTomorrow)
          .catch(() => setDueTomorrow(null))
      }
    }
  }, [allDone, view.mode, celebrate, user])

  const handleComplete = useCallback(async (stepId: string) => {
    clearStepStorage()
    await markDone(stepId)
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [markDone, router])

  const handleExit = useCallback(() => {
    clearStepStorage()
    router.replace('/daily')
    setView({ mode: 'checklist' })
  }, [router])

  const recommendation = useMemo(() => {
    if (status !== 'ready' || !plan?.arc) return null
    return resolveRecommendedMode({
      fromDaily: true,
      arc: plan.arc,
      lastModeId: null,
    })
  }, [status, plan?.arc])

  // ── Render: sesión de un paso ──────────────────────────────────────────────
  if (view.mode === 'step') {
    const { step, exerciseIndex } = view
    const stepIndex = steps.findIndex((s) => s.id === step.id)
    return (
      <DailyStepSession
        step={step}
        allSteps={steps}
        stepIndex={stepIndex >= 0 ? stepIndex : 0}
        sessionKey={sessionKey}
        initialExerciseIndex={exerciseIndex}
        onComplete={() => handleComplete(step.id)}
        onExit={handleExit}
      />
    )
  }

  // ── Render: pantalla de cierre ─────────────────────────────────────────────
  if (view.mode === 'done') {
    return (
      <SessionRecapCard
        arc={plan?.arc}
        stepCount={steps.length}
        dueTomorrow={dueTomorrow}
        streak={streak}
      />
    )
  }

  // ── Render: hub sin paso activo ────────────────────────────────────────────
  // El plan de pasos SRS vive en Home. /daily es una superficie opcional y
  // complementaria: la lección del día (principal), una sugerencia de rutina,
  // el log de inmersión y práctica extra. Nada aquí es obligatorio.
  return (
    <PageLayout archetype="session">
      <PageHeader
        variant="compact"
        kicker="Hoy"
        title="Sesión diaria"
        subtitle="La lección de hoy y práctica extra opcional"
      />

      {status === 'ready' ? (
        <div className="flex flex-col gap-4">
          <SessionOpeningBanner arc={plan?.arc} />
          <DailyLessonCard lesson={conceptLesson} />
          <StudyTipDisclosure />
        </div>
      ) : status === 'error' ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border-default bg-daily-card px-[var(--layout-card-pad)] py-[var(--layout-section-gap)] text-center">
          <p className="font-body-sm text-error">No se pudo preparar tu plan.</p>
          <Button type="button" variant="primary" size="md" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      ) : null}

      {/* External Immersion Logger */}
      <div className="mt-[var(--layout-section-gap)]">
        <ImmersionLogCard />
      </div>

      {recommendation ? (
        <div className="mt-[var(--layout-section-gap)]">
          <p className="font-kicker mb-[var(--layout-stack-tight)] text-fg-muted">
            Ejercicios extra de hoy
          </p>
          <RecommendedPracticeCard recommendation={recommendation} />
        </div>
      ) : null}

      <div className="mt-[var(--layout-section-gap)] flex flex-col items-center gap-2 text-center">
        <Link
          href="/courses"
          className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-caption font-medium text-fg-muted transition-colors hover:text-primary"
        >
          <GraduationCap size={14} className="text-primary" aria-hidden />
          Ver cursos y teoría
        </Link>
        <Link
          href="/practice"
          className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-caption font-medium text-fg-muted transition-colors hover:text-primary"
        >
          <Sparkles size={14} className="text-primary" aria-hidden />
          ¿Práctica libre? Elige qué trabajar
        </Link>
      </div>
    </PageLayout>
  )
}
