'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Flame } from 'lucide-react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import PracticeSession from '@/components/practice/PracticeSession'
import DailyStepList from '@/components/daily/DailyStepList'
import { DailyStepIcon } from '@/components/daily/dailyIcons'
import { useDailyPlan, type ConceptLesson, type DailyStep } from '@/hooks/useDailyPlan'
import { useAuth } from '@/components/auth/AuthProvider'
import type { DailyStreakResult } from '@/lib/daily/streak'
import type { DailyPlanPreview } from '@/lib/home/constants'

interface HomeDailyCardProps {
  streak?: DailyStreakResult
  /** Preview ligero del server (se muestra antes de generar el plan real). */
  preview?: DailyPlanPreview | null
  conceptLesson: ConceptLesson | null
}

const CARD_STYLE = {
  background:
    'linear-gradient(150deg, color-mix(in oklch, var(--primary) 12%, transparent), var(--surface-raised) 65%)',
  borderColor: 'var(--accent-border)',
}

function expandedKey(userId: string): string {
  const now = new Date()
  const date = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`
  return `daily-expanded:${userId}:${date}`
}

/**
 * Tarjeta de la diaria en el home. Por defecto muestra el preview de los 5
 * pasos; al pulsar "Empezar plan de hoy" genera el plan real y despliega el
 * checklist embebido. Tocar un paso abre su sesión de ejercicios a pantalla
 * completa (overlay) y al terminar vuelve al home con el paso marcado.
 *
 * Tanto el plan generado como el estado expandido se persisten en localStorage
 * con clave de fecha: al recargar el mismo día se restaura sin regenerar.
 */
export default function HomeDailyCard({ streak, preview, conceptLesson }: HomeDailyCardProps) {
  const { user } = useAuth()
  const { status, steps, doneIds, completedCount, allDone, load, markDone, celebrate } = useDailyPlan({
    conceptLesson,
    autoLoad: false,
  })

  const [expanded, setExpanded] = useState(false)
  const [activeStep, setActiveStep] = useState<DailyStep | null>(null)
  const [sessionKey, setSessionKey] = useState(0)

  const completedToday = streak?.completedToday ?? false
  const previewSteps = preview?.steps ?? []
  const isNewUser = preview?.isNewUser ?? false
  const estMinutes = preview?.estMinutes ?? Math.max(10, previewSteps.length * 2)

  // Restaurar estado expandido desde localStorage una vez que el usuario está disponible.
  useEffect(() => {
    if (!user) return
    if (window.localStorage.getItem(expandedKey(user.id)) === '1') {
      setExpanded(true)
    }
  }, [user])

  // Cargar el plan cuando la card está expandida y el plan aún no está listo.
  useEffect(() => {
    if (expanded && (status === 'idle' || status === 'error')) void load()
  }, [expanded, status, load])

  // Celebra una vez cuando todos los pasos quedan hechos.
  useEffect(() => {
    if (expanded && allDone && !activeStep) celebrate()
  }, [expanded, allDone, activeStep, celebrate])

  const handleStart = useCallback(() => {
    setExpanded(true)
    if (user) {
      try { window.localStorage.setItem(expandedKey(user.id), '1') } catch {}
    }
    if (status === 'idle' || status === 'error') void load()
  }, [status, load, user])

  const handleStartStep = useCallback((step: DailyStep) => {
    if (step.kind === 'concept') return // lo maneja el Link de DailyStepList
    setSessionKey((k) => k + 1)
    setActiveStep(step)
  }, [])

  // ── Overlay de sesión a pantalla completa ──────────────────────────────────
  if (activeStep) {
    return (
      <div className="fixed inset-0 z-50 bg-[var(--surface-base)]">
        <PracticeSession
          key={sessionKey}
          context="daily"
          exercises={activeStep.exercises}
          sessionLength={activeStep.exercises.length}
          sessionLabel={activeStep.title}
          onSessionComplete={() => markDone(activeStep.id)}
          onExit={() => setActiveStep(null)}
        />
      </div>
    )
  }

  // ── Vista colapsada: preview + CTA ─────────────────────────────────────────
  if (!expanded) {
    return (
      <div className="flex flex-col rounded-[var(--radius-xl)] border p-6" style={CARD_STYLE}>
        <Badge label="Plan de hoy" variant="default" className="self-start mb-3.5" />
        <h3 className="text-2xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
          Tu diaria
        </h3>
        <p className="mt-1 text-[15px] text-[var(--text-secondary)] leading-snug">
          {isNewUser
            ? 'Empieza con una mezcla de sonidos, pares mínimos y un concepto nuevo — sin necesidad de avance previo.'
            : 'Una mezcla equilibrada de repaso, tus sonidos débiles y algo nuevo.'}
        </p>

        <ol className="mt-5 flex flex-col gap-2.5">
          {previewSteps.map((step, i) => (
            <li key={step.id} className="flex items-center gap-3 text-[15px]">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-[var(--primary)]">
                <DailyStepIcon name={step.icon} size={14} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[var(--text-primary)]">{step.title}</span>
              <span className="font-medium text-[var(--text-tertiary)]" style={{ fontFamily: 'var(--font-display), serif' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-auto pt-5">
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight size={15} />}
            iconPosition="right"
            className="justify-center py-3.5 text-base"
            onClick={handleStart}
          >
            {completedToday ? 'Practicar de nuevo' : 'Empezar plan de hoy'}
          </Button>
          <p className="mt-2.5 text-center text-[13px] text-[var(--text-tertiary)]">
            ≈ {estMinutes} min · {previewSteps.length} pasos
          </p>
        </div>
      </div>
    )
  }

  // ── Vista expandida: checklist real embebido ───────────────────────────────
  return (
    <div className="flex flex-col rounded-[var(--radius-xl)] border p-6" style={CARD_STYLE}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge label="Plan de hoy" variant="default" />
        {status === 'ready' && (
          <span className="text-[13px] text-[var(--text-tertiary)]">
            {completedCount} de {steps.length}
          </span>
        )}
      </div>

      {status === 'loading' && (
        <div className="flex items-center justify-center py-10">
          <span className="animate-pulse text-fg-subtle">Preparando tu plan de hoy…</span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-error">No se pudo preparar tu plan de hoy.</p>
          <Button type="button" variant="primary" size="sm" onClick={() => void load()}>
            Reintentar
          </Button>
        </div>
      )}

      {status === 'ready' &&
        (allDone ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--hue-icon-bg)] text-[var(--primary)]">
              <Flame size={24} />
            </div>
            <p className="text-lg font-medium text-[var(--text-primary)]">¡Diaria cumplida!</p>
            <p className="max-w-xs text-[13px] text-[var(--text-secondary)]">
              Completaste tus {steps.length} pasos de hoy. Tu racha sigue viva.
            </p>
            <Link href="/practice/sounds">
              <Button variant="secondary" size="sm" icon={<ArrowRight size={14} />} iconPosition="right">
                Ejercicios libres
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
              <div
                className="h-full w-full rounded-full bg-[var(--primary)] origin-left transition-transform duration-300 ease-out"
                style={{ transform: `scaleX(${steps.length ? completedCount / steps.length : 0})` }}
              />
            </div>
            <DailyStepList
              steps={steps}
              doneIds={doneIds}
              onStartStep={handleStartStep}
              onMarkDone={markDone}
            />
          </>
        ))}
    </div>
  )
}
