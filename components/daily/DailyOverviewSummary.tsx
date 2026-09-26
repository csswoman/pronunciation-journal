'use client'

import PastelCard from '@/components/layout/PastelCard'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import { speakText } from '@/lib/speech/synthesis'
import { Volume2 } from '@/components/icons'
import type { SessionArc } from '@/lib/practice/types'
import type { DailyStep, DailyStepStatus } from '@/hooks/useDailyPlan'

interface Props {
  steps: DailyStep[]
  getStepStatus: (stepId: string) => DailyStepStatus
  completedCount: number
  arc: SessionArc | undefined
  /** Repasos programados para mañana. null mientras carga o si falla. */
  dueTomorrow: number | null
  /** Palabras esenciales aprendidas (Core 1000). */
  learned?: number
  /** Total de palabras esenciales del nivel del usuario. null si no está disponible. */
  essentialWordsTotal: number | null
}

export default function DailyOverviewSummary({
  steps,
  getStepStatus,
  completedCount,
  arc,
  dueTomorrow,
  learned = 0,
  essentialWordsTotal = null,
}: Props) {
  if (steps.length === 0) return null

  const remainingMinutes = steps.reduce((sum, s) => {
    const st = getStepStatus(s.id)
    if (st === 'done' || st === 'resolved') return sum
    return sum + (s.estMinutes || 0)
  }, 0)

  const soundIpa = arc?.soundIpa ? formatIpaDisplay(arc.soundIpa) : null
  const topicTitle = arc?.topicLabel || (soundIpa ? (soundIpa.includes('ə') ? 'La vocal neutra' : `Sonido ${soundIpa}`) : 'Repaso general')
  const exampleWords = soundIpa?.includes('ə')
    ? 'Aparece en about, sofa, problem.'
    : 'Práctica diaria de pronunciación y percepción.'

  return (
    <section aria-label={soundIpa ? "Resumen del sonido del día" : "Resumen del día"}>
      <PastelCard
        tone="sky"
        className="flex flex-col gap-4 p-5 sm:p-6 motion-reduce:shadow-none"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Foco / Sonido del día destacado */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {soundIpa ? (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-ink/10 text-ink font-ipa text-display-ipa font-bold select-none"
                aria-label={`Sonido del día ${soundIpa}`}
              >
                {soundIpa}
              </div>
            ) : null}
            <div className="flex flex-col min-w-0">
              <span className="font-sans text-caption font-bold uppercase tracking-wider text-ink-muted">
                {soundIpa ? 'Sonido del día' : 'Foco de hoy'}
              </span>
              <h2 className="font-heading text-h2 font-extrabold text-ink truncate">
                {topicTitle}
              </h2>
              {arc?.topicLabel && soundIpa ? (
                <p className="font-body-sm text-ink-secondary truncate">
                  Sonido {soundIpa}
                </p>
              ) : (
                <p className="font-body-sm text-ink-secondary truncate">
                  {exampleWords}
                </p>
              )}
            </div>
          </div>

          {/* Métricas y Acción Audio */}
          <div className="flex items-center gap-4 sm:gap-6 self-start md:self-center shrink-0 border-t border-ink/10 pt-3 md:border-t-0 md:pt-0">
            <div className="grid grid-cols-3 items-center gap-4 sm:gap-6 text-center md:text-left">
              <div className="flex flex-col">
                <span className="font-sans text-tiny font-bold uppercase tracking-wider text-ink-muted">
                  Actividades
                </span>
                <span className="font-heading text-h3 font-extrabold text-ink tabular-nums">
                  {`${completedCount} / ${steps.length}`}
                </span>
              </div>

              <div className="flex flex-col border-l border-ink/10 pl-4 sm:pl-6">
                <span className="font-sans text-tiny font-bold uppercase tracking-wider text-ink-muted">
                  Te queda
                </span>
                <span className="font-heading text-h3 font-extrabold text-ink tabular-nums">
                  {remainingMinutes} min
                </span>
              </div>

              <div className="flex flex-col border-l border-ink/10 pl-4 sm:pl-6">
                <span className="font-sans text-tiny font-bold uppercase tracking-wider text-ink-muted">
                  Mañana
                </span>
                <span className="font-heading text-h3 font-extrabold text-ink tabular-nums">
                  <span>{dueTomorrow ?? 0}</span> repasos
                </span>
              </div>
            </div>

            {soundIpa ? (
              <button
                type="button"
                onClick={() => speakText(soundIpa.replace(/\//g, ''))}
                aria-label={`Escuchar sonido ${soundIpa}`}
                className="press-feedback focus-ring shrink-0 flex h-11 w-11 items-center justify-center rounded-full bg-ink text-paper shadow-xs hover:scale-105 active:scale-95 transition-transform"
              >
                <Volume2 size={20} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        {learned > 0 ? (
          <div className="border-t border-ink/10 pt-3 flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-body-sm">
              <span className="font-sans text-caption font-bold uppercase tracking-wider text-ink-muted">
                Palabras esenciales
              </span>
              <span className="font-heading font-extrabold text-ink tabular-nums">
                <span>{learned}</span>
                {essentialWordsTotal != null ? (
                  <span className="text-ink-secondary"> / {essentialWordsTotal}</span>
                ) : (
                  <span className="text-ink-secondary"> palabras</span>
                )}
              </span>
            </div>
            {essentialWordsTotal != null ? (
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={essentialWordsTotal}
                aria-valuenow={learned}
                aria-label="Progreso de palabras esenciales"
                className="h-2 w-full overflow-hidden rounded-full bg-paper/60 border border-ink/10"
              >
                <div
                  className="h-full rounded-full bg-ink transition-[width] duration-500 motion-reduce:transition-none"
                  style={{ width: `${Math.min(100, (learned / essentialWordsTotal) * 100)}%` }}
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </PastelCard>
    </section>
  )
}
