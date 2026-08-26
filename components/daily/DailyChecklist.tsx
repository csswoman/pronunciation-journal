'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from '@/components/icons'
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
import { RoutinePresetSelector, type DailyRoutinePreset } from './RoutinePresetSelector'
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
  const { plan, status, steps, getStepStatus, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const [view, setView] = useState<View>({ mode: 'checklist' })
  const [sessionKey, setSessionKey] = useState(0)
  const [dueTomorrow, setDueTomorrow] = useState<number | null>(null)
  const [routinePreset, setRoutinePreset] = useState<DailyRoutinePreset>('salas-60')
  const [silentPeriod, setSilentPeriod] = useState(false)
  // Prevents double-triggering the initialStepId auto-start.
  const autoStartedRef = useRef(false)

  // Auto-start: when plan is ready, jump straight into a step — the one from the
  // URL if present, otherwise the next actionable step. The full checklist lives
  // on Home; /daily is the session surface, not a second copy of the list.
  useEffect(() => {
    if (status !== 'ready' || autoStartedRef.current) return
    const targetId = initialStepId ?? steps.find((s) => {
      const st = getStepStatus(s.id)
      return st !== 'done' && st !== 'resolved'
    })?.id
    if (!targetId) return
    const step = steps.find((s) => s.id === targetId)
    if (!step || step.kind === 'concept' || step.kind === 'study_deck' || step.kind === 'mission') return
    autoStartedRef.current = true
    const stored = readStepStorage()
    const exerciseIndex = stored?.stepId === targetId ? (stored.exerciseIndex ?? 0) : 0
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step, exerciseIndex })
  }, [status, steps, initialStepId, getStepStatus])

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

  // ── Render: checklist ──────────────────────────────────────────────────────
  return (
    <PageLayout archetype="session">
      <PageHeader
        variant="compact"
        kicker="Hoy"
        title="Sesión diaria"
        subtitle={
          status === 'ready'
            ? steps.length > 0
              ? 'Preparando el siguiente paso…'
              : 'Tu plan se arma con cursos y sonidos.'
            : status === 'error'
              ? 'No se pudo preparar tu plan.'
              : 'Preparando tu plan…'
        }
      />

      {status === 'ready' ? (
        <div className="flex flex-col gap-4">
          <SessionOpeningBanner arc={plan?.arc} />

          {/* Routine Preset Selector */}
          <RoutinePresetSelector
            currentPreset={routinePreset}
            onSelectPreset={setRoutinePreset}
            silentPeriodMode={silentPeriod}
            onToggleSilentPeriod={setSilentPeriod}
          />
        </div>
      ) : status === 'loading' ? (
        <div className="flex flex-col gap-4" aria-hidden>
          <div className="h-[76px] rounded-[var(--radius-lg)] border border-border-subtle bg-surface-subtle animate-pulse" />
          <div className="h-10 rounded-[var(--radius-md)] border border-border-subtle bg-surface-subtle animate-pulse" />
        </div>
      ) : null}

      {status === 'ready' && steps.length === 0 && !allDone ? (
        <div className="mt-4 flex flex-col items-center gap-3 rounded-xl border border-border-default bg-daily-card px-[var(--layout-card-pad)] py-[var(--layout-section-gap)] text-center">
          <p className="font-body-sm text-fg-muted">
            Se arma cuando empiezas un curso o practicas sonidos.
          </p>
          <Link
            href="/courses"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-caption font-medium text-primary"
          >
            Explorar cursos
          </Link>
        </div>
      ) : null}

      {status === 'ready' && steps.length > 0 ? (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-border-default bg-daily-card px-[var(--layout-card-pad)] py-[var(--layout-section-gap)] text-center">
          <p className="font-body-sm text-fg-muted">
            El siguiente paso necesita elegirse desde el plan de Inicio.
          </p>
          <Link
            href="/"
            className="focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 font-caption font-medium text-primary"
          >
            Ver plan del día
          </Link>
        </div>
      ) : null}

      {status === 'error' ? (
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
            Después del plan
          </p>
          <RecommendedPracticeCard recommendation={recommendation} />
        </div>
      ) : null}

      <div className="mt-[var(--layout-section-gap)] flex flex-col items-center text-center">
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
