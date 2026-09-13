'use client'

// Planned structure:
// <DailyChecklist>
//   DailyOverviewSummary (incluye foco del día destacado + métricas)
//   DailyPlanCard (expandido: los 5 pasos + hints)
//   DailyLessonCard
//   StudyTipDisclosure
//   ImmersionLogCard
//   RecommendedPracticeCard
// </DailyChecklist>

import { useEffect, useMemo, useState } from 'react'
import PageLayout from '@/components/layout/PageLayout'
import PageHeader from '@/components/layout/PageHeader'
import dynamic from 'next/dynamic'
import RecommendedPracticeCard from '@/components/practice/hub/RecommendedPracticeCard'
import { resolveRecommendedMode } from '@/lib/practice/practice-modes'

const DailyStepSession = dynamic(() => import('./DailyStepSession'), {
  loading: () => <div className="p-8 text-center text-fg-muted font-caption">Cargando sesión…</div>,
})
import SessionRecapCard from './SessionRecapCard'
import DailyPlanCard from './DailyPlanCard'
import DailyOverviewSummary from './DailyOverviewSummary'
import DailyProgressSidebar from './DailyProgressSidebar'
import DailyExploreLinks from './DailyExploreLinks'
import type { WeeklyProgressData } from '@/lib/progress/weekly-queries'
import DailyLessonCard from './DailyLessonCard'
import StudyTipDisclosure from './StudyTipDisclosure'
import { ImmersionLogCard } from './ImmersionLogCard'
import { useAuth } from '@/components/auth/AuthProvider'
import { useDailyPlan, type ConceptLesson } from '@/hooks/useDailyPlan'
import { useDailySessionRunner } from '@/hooks/useDailySessionRunner'
import { fetchDueTomorrowCount } from '@/lib/review/client-queries'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'

export type { ConceptLesson }

// ── Types ───────────────────────────────────────────────────────────────────

interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
  initialStepId?: string
  /** Current streak in days, fetched server-side. null when unavailable. */
  streak?: number | null
  /** Corte semanal del progreso para el sidebar. null si falló o no hay sesión. */
  weeklyProgress?: WeeklyProgressData | null
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DailyChecklist({
  conceptLesson,
  initialStepId,
  streak = null,
  weeklyProgress = null,
}: DailyChecklistProps) {
  const { user } = useAuth()
  const { plan, status, steps, allDone, completedCount, getStepStatus, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const {
    view,
    sessionKey,
    startStep,
    completeStep,
    exitStep,
    resumeFromUrlStep,
    setView,
  } = useDailySessionRunner({
    steps,
    markDone,
    getStepStatus,
  })

  const [dueTomorrow, setDueTomorrow] = useState<number | null>(null)

  // Single reactive subscription shared by SessionOpeningBanner and SessionRecapCard —
  // both previously ran this identical srsData query independently.
  const learnedCount = useLiveQuery(
    () => user?.id ? db.srsData.filter((e) => e.userId === user.id && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX)).count() : 0,
    [user?.id],
    0,
  )

  useEffect(() => {
    if (status !== 'ready' || !initialStepId) return
    resumeFromUrlStep(initialStepId)
  }, [status, initialStepId, resumeFromUrlStep])

  // /daily muestra "qué me espera mañana" en el resumen, no sólo en el recap:
  // se pide una vez al montar en lugar de esperar a completar el plan.
  useEffect(() => {
    if (!user) return
    let cancelled = false
    fetchDueTomorrowCount(user.id)
      .then((count) => { if (!cancelled) setDueTomorrow(count) })
      .catch(() => { if (!cancelled) setDueTomorrow(null) })
    return () => { cancelled = true }
  }, [user])

  // Celebrate once when all steps are complete.
  useEffect(() => {
    if (allDone && view.mode === 'idle') {
      setView({ mode: 'done' })
      celebrate()
    }
  }, [allDone, view.mode, celebrate, setView])

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
        onComplete={() => void completeStep(step.id)}
        onExit={exitStep}
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
        learned={learnedCount}
      />
    )
  }

  // ── Render: hub sin paso activo ────────────────────────────────────────────
  // Home y /daily comparten el mismo plan (useDailyPlan) y el mismo motor de
  // sesión (useDailySessionRunner). La diferencia es el encuadre: Home muestra
  // sólo el paso siguiente para ejecutar; /daily despliega el día entero —
  // los pasos con su porqué, el resumen de progreso, la lección, inmersión y
  // práctica extra. Tocar un paso aquí lo corre en sitio, igual que en Home.
  return (
    <PageLayout archetype="dashboard">
      <PageHeader
        variant="compact"
        kicker="Hoy"
        title="Tu día completo"
        subtitle="Todo lo de hoy: el plan, la lección y práctica extra"
        actions={
          streak != null && streak > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-surface-raised px-3 py-1 font-kicker text-caption font-medium text-fg">
              <span aria-hidden>🔥</span>
              <span>{streak} {streak === 1 ? 'día' : 'días'}</span>
            </div>
          ) : undefined
        }
      />

      {/* Dos columnas: el día a la izquierda, el corte semanal a la derecha,
          para que el contenido no se alargue hacia abajo. En móvil se apila. */}
      <div
        className={
          weeklyProgress
            ? 'grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]'
            : 'grid grid-cols-1'
        }
      >
        <div className="flex min-w-0 flex-col gap-[var(--layout-section-gap)]">
        {status === 'ready' ? (
          <DailyOverviewSummary
            steps={steps}
            getStepStatus={getStepStatus}
            completedCount={completedCount}
            arc={plan?.arc}
            dueTomorrow={dueTomorrow}
            learned={learnedCount}
          />
        ) : null}

        {/* El plan del día, desplegado entero. Home usa este mismo componente
            con collapseFutureSteps y hideThreadHints; aquí van al revés. */}
        <DailyPlanCard
          status={status}
          steps={steps}
          getStepStatus={getStepStatus}
          completedCount={completedCount}
          allDone={allDone}
          onStartStep={startStep}
          onRetry={() => void load()}
          collapseFutureSteps={false}
          hideThreadHints={false}
          showTitle
          arc={plan?.arc}
        />

        {/* El estado de error lo renderiza DailyPlanCard (con su Reintentar);
            aquí sólo va el contenido complementario del día. */}
        {status === 'ready' ? (
          <div className="flex flex-col gap-4">
            <DailyLessonCard lesson={conceptLesson} />
            <StudyTipDisclosure />
          </div>
        ) : null}

        {/* External Immersion Logger */}
        <div>
          <ImmersionLogCard />
        </div>

        {recommendation ? (
          <div>
            <p className="font-kicker mb-[var(--layout-stack-tight)] text-fg-muted">
              Ejercicios extra de hoy
            </p>
            <RecommendedPracticeCard recommendation={recommendation} />
          </div>
        ) : null}

        <DailyExploreLinks />
        </div>

        {weeklyProgress ? <DailyProgressSidebar data={weeklyProgress} /> : null}
      </div>
    </PageLayout>
  )
}
