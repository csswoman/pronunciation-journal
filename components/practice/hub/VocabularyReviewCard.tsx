'use client'

// Planned structure:
// <VocabularyReviewCard>
//   header: kicker + due-count badge (pending / al día / cargando)
//   title + description
//   SRS status row
//   actions: empezar repaso / explorar catálogo
// </VocabularyReviewCard>

import Link from 'next/link'
import { ListOrdered, RotateCcw, ArrowRight, CheckCircle2 } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { cn } from '@/lib/cn'

interface Props {
  dueCount: number | null
}

export default function VocabularyReviewCard({ dueCount }: Props) {
  const hasDueReviews = dueCount !== null && dueCount > 0
  const reviewStatusKnown = dueCount !== null

  return (
    <div className="group/srs flex flex-col justify-between gap-5 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-border-default hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--hue-icon-bg)] text-primary transition-transform group-hover/srs:scale-105">
              <ListOrdered size={18} aria-hidden />
            </span>
            <span className="font-kicker text-fg-subtle">Vocabulario</span>
          </div>
          {hasDueReviews ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning-soft px-2.5 py-1 text-caption font-semibold text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              <span>{dueCount} por repasar</span>
            </span>
          ) : reviewStatusKnown ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2.5 py-1 text-caption font-medium text-success">
              <CheckCircle2 size={13} aria-hidden />
              Al día
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-1 text-caption font-medium text-fg-muted">
              Comprobando estado…
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg">Palabras esenciales</h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Aprende y consolida las 1000 palabras de mayor frecuencia con un algoritmo de repetición espaciada.
          </p>
        </div>

        {/* Estado accionable del repaso; no representa una métrica de dominio. */}
        <div className="flex flex-col gap-3 border-y border-border-subtle py-4">
          <div className="flex items-center justify-between gap-3 text-caption text-fg-subtle">
            <span className="font-kicker">Repaso espaciado</span>
            <span className="text-right font-medium text-fg">Ajustado a tus respuestas</span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-body-sm font-semibold text-fg">
              {hasDueReviews
                ? 'Tu siguiente acción'
                : reviewStatusKnown
                  ? 'No hay repasos pendientes'
                  : 'Cargando tus repasos'}
            </span>
            <span className="font-mono text-body-sm font-bold text-fg-muted">
              {hasDueReviews ? `${dueCount} palabras` : reviewStatusKnown ? 'Listo' : '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Acción primaria: trabajar lo que ya está listo. */}
            <Link
              href="/practice/review"
              onClick={() => void setLastPracticeMode('review')}
              className={cn(
                'focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-3 font-label font-semibold transition-[background-color,box-shadow,transform] duration-200 active:scale-[0.96]',
                hasDueReviews
                  ? 'bg-fg text-surface-base shadow-sm hover:bg-fg/90 hover:shadow-md'
                  : 'border border-border-default bg-surface-sunken text-fg hover:bg-surface-raised hover:shadow-xs',
              )}
            >
              <RotateCcw size={16} aria-hidden />
              <span>{hasDueReviews ? 'Empezar repaso' : 'Abrir repaso'}</span>
              {hasDueReviews ? (
                <span className="rounded-full bg-surface-base/20 px-2 py-0.5 font-mono text-tiny">
                  {dueCount}
                </span>
              ) : null}
            </Link>

            {/* Acción secundaria: consultar el catálogo, sin duplicar el título. */}
            <Link
              href="/practice/essential-words"
              onClick={() => void setLastPracticeMode('essential-words')}
              className="focus-ring group/vocab inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-4 py-3 font-label font-semibold text-fg transition-[background-color,box-shadow,transform] duration-200 hover:bg-surface-sunken hover:shadow-xs active:scale-[0.96]"
            >
              <span>Explorar catálogo</span>
              <ArrowRight size={16} className="text-primary transition-transform duration-150 group-hover/vocab:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
