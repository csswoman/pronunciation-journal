'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame, Sparkles } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import PracticeSession from '@/components/practice/PracticeSession'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import DailyStepList from './DailyStepList'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'

export type { ConceptLesson }

interface DailyChecklistProps {
  conceptLesson: ConceptLesson | null
}

type View = { mode: 'checklist' } | { mode: 'step'; step: DailyStep } | { mode: 'done' }

export default function DailyChecklist({ conceptLesson }: DailyChecklistProps) {
  const { status, steps, doneIds, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: true,
  })

  const [view, setView] = useState<View>({ mode: 'checklist' })
  const [sessionKey, setSessionKey] = useState(0)

  // Cuando se completan todos los pasos, celebra una vez.
  useEffect(() => {
    if (allDone && view.mode === 'checklist') {
      setView({ mode: 'done' })
      celebrate()
    }
  }, [allDone, view.mode, celebrate])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return // lo maneja el Link
    setSessionKey((k) => k + 1)
    setView({ mode: 'step', step })
  }, [])

  // ── Render: estados de carga / error ──────────────────────────────────────
  // `fixed inset-0` centra respecto al viewport visible, no respecto al alto
  // del <main> con scroll del dashboard — así el texto queda en el centro real.
  if (status === 'loading' || status === 'idle') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center">
        <div className="animate-pulse text-fg-subtle">Preparando tu plan de hoy…</div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="phoneme-focus fixed inset-0 z-40 flex items-center justify-center p-6">
        <div className="space-y-3 text-center">
          <p className="text-error">No se pudo preparar tu plan de hoy. Inténtalo de nuevo.</p>
          <Button type="button" variant="primary" size="sm" onClick={load}>
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  // ── Render: sesión de un paso ──────────────────────────────────────────────
  if (view.mode === 'step') {
    const step = view.step
    return (
      <PracticeSession
        key={sessionKey}
        context="daily"
        exercises={step.exercises}
        sessionLength={step.exercises.length}
        sessionLabel={step.title}
        onSessionComplete={() => markDone(step.id)}
        onExit={() => setView({ mode: 'checklist' })}
      />
    )
  }

  // ── Render: pantalla "diaria cumplida" ─────────────────────────────────────
  if (view.mode === 'done') {
    return (
      <PageLayout className="mx-auto max-w-[640px]">
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
            <Flame size={30} />
          </div>
          <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
            ¡Diaria cumplida!
          </h1>
          <p className="max-w-sm text-[15px] text-[var(--text-secondary)]">
            Completaste tus {steps.length} pasos de hoy. Tu racha sigue viva — vuelve mañana para
            mantenerla.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="/">
              <Button variant="primary" size="md">
                Volver al inicio
              </Button>
            </Link>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="md" icon={<ArrowRight size={15} />} iconPosition="right">
                Ejercicios libres
              </Button>
            </Link>
          </div>
        </div>
      </PageLayout>
    )
  }

  // ── Render: checklist ──────────────────────────────────────────────────────
  return (
    <PageLayout className="mx-auto max-w-[680px]">
      <header className="mb-6">
        <Badge label="Plan de hoy" variant="default" className="mb-3" />
        <h1 className="text-3xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
          Tu diaria
        </h1>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)]">
          {completedCount} de {steps.length} pasos · completa los {steps.length} para mantener tu racha.
        </p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-300"
            style={{ width: `${steps.length ? (completedCount / steps.length) * 100 : 0}%` }}
          />
        </div>
      </header>

      <DailyStepList
        steps={steps}
        doneIds={doneIds}
        onStartStep={handleStartStep}
        onMarkDone={markDone}
      />

      <div className="mt-8 flex flex-col items-center gap-2 text-center">
        <Link href="/practice/sounds" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
          <Sparkles size={14} />
          ¿Prefieres ejercicios libres? Practica lo que quieras
        </Link>
      </div>
    </PageLayout>
  )
}
