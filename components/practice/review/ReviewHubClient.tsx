'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { getWordStrength } from '@/lib/word-bank/strength'
import { useReviewSession } from '@/hooks/useReviewSession'
import { ReviewSessionLauncher } from '@/components/practice/review/ReviewSessionLauncher'
import { ReviewSectionCard } from '@/components/practice/review/ReviewSectionCard'
import type { ReviewHubSummary } from '@/lib/review/types'

interface Props {
  summary: ReviewHubSummary
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

export function ReviewHubClient({ summary }: Props) {
  const { state, sessionKey, startReview, startFailedItem, advanceStep, exitSession } =
    useReviewSession()
  const { counts } = summary
  const canStart = summary.canStartReview && state.phase !== 'loading'

  return (
    <>
      <ReviewSessionLauncher
        state={state}
        sessionKey={sessionKey}
        onStepComplete={advanceStep}
        onExit={exitSession}
      />

      <div className="flex flex-col gap-4">
        <ReviewSectionCard
          title="Frases falladas"
          count={counts.failedSentences}
          emptyMessage="Sin errores recientes en dictados u oraciones."
        >
          <ul className="flex flex-col gap-2">
            {summary.failedSentences.slice(0, 4).map((item) => (
              <li
                key={item.contentId}
                className="flex items-start justify-between gap-3 font-body-sm text-fg-secondary"
              >
                <div className="min-w-0">
                  <span className="text-fg">{item.label}</span>
                  <span className="ml-2 font-caption text-fg-muted">{item.typeLabel}</span>
                  {!item.drillable ? (
                    <span className="ml-2 font-caption text-fg-subtle">· solo historial</span>
                  ) : null}
                </div>
                {item.drillable && state.phase !== 'loading' ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-primary"
                    onClick={() => startFailedItem(item)}
                  >
                    Practicar
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Palabras débiles"
          count={counts.weakWords}
          emptyMessage="No hay palabras en learning — buen trabajo."
        >
          <ul className="flex flex-col gap-3">
            {summary.weakWords.slice(0, 4).map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-medium text-fg">{w.text}</p>
                  {w.translation ? (
                    <p className="font-body-sm text-fg-muted">{w.translation}</p>
                  ) : null}
                </div>
                <WordStrengthBars strength={getWordStrength(w)} size={14} />
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="SRS pendiente"
          count={counts.dueWords}
          emptyMessage="Ninguna palabra vence hoy."
        >
          <ul className="flex flex-col gap-2">
            {summary.dueWords.slice(0, 4).map((w) => (
              <li key={w.id} className="font-body-sm text-fg">
                {w.text}
                {w.ipa ? (
                  <span className="font-ipa ml-2 text-primary">{formatIpa(w.ipa)}</span>
                ) : null}
              </li>
            ))}
          </ul>
          {counts.dueWords > 0 ? (
            <Link href="/words" className="font-caption text-primary hover:opacity-80">
              Ver léxico →
            </Link>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Sonidos due"
          count={counts.soundsDue}
          emptyMessage="Ningún contraste fonémico vence hoy."
        >
          <ul className="flex flex-col gap-2">
            {summary.soundsDue.slice(0, 4).map((s) => (
              <li key={`${s.soundId}-${s.ipa}`} className="font-body-sm text-fg">
                <span className="font-ipa text-primary">{formatIpa(s.ipa)}</span>
                {s.example ? (
                  <span className="ml-2 text-fg-secondary">{s.example}</span>
                ) : null}
                <span className="ml-2 font-caption text-fg-muted">
                  {s.daysOverdue > 0 ? `${s.daysOverdue}d overdue` : 'due today'}
                </span>
              </li>
            ))}
          </ul>
          {counts.soundsDue > 0 ? (
            <Link href="/practice/sounds" className="font-caption text-primary hover:opacity-80">
              Sound Lab →
            </Link>
          ) : null}
        </ReviewSectionCard>

        {state.phase === 'done' ? (
          <div className="rounded-[var(--radius-md)] bg-[var(--success-soft)] px-4 py-3 text-center font-body-sm text-fg-secondary">
            Repaso completo. Vuelve mañana o sigue practicando en el plan diario.
          </div>
        ) : state.phase === 'loading' ? (
          <Button type="button" variant="primary" size="md" fullWidth disabled>
            Preparando…
          </Button>
        ) : canStart ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            icon={<ArrowRight size={15} />}
            iconPosition="right"
            onClick={startReview}
          >
            Iniciar repaso completo
          </Button>
        ) : state.phase === 'idle' ? (
          <Link
            href="/daily"
            className={cn(
              'inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-3',
              'text-sm font-semibold transition-all duration-150 ease-out-quart focus-ring',
              'bg-[var(--cta-bg)] text-[var(--cta-fg)] hover:bg-[var(--cta-bg-hover)]',
            )}
          >
            Ir a practicar
            <ArrowRight size={15} aria-hidden />
          </Link>
        ) : null}

        {state.phase === 'error' ? (
          <p className="font-caption text-center text-error">No se pudo cargar el repaso.</p>
        ) : null}

        {!summary.canStartReview && state.phase === 'idle' ? (
          <p className="font-body-sm text-center text-fg-muted">
            {counts.failedSentences > 0 && counts.reviewable === 0
              ? 'Tienes errores recientes en el historial, pero nada listo para repasar hoy. Sigue con el plan diario.'
              : 'Nada pendiente ahora. Practica en el plan diario para generar nuevos ítems.'}
          </p>
        ) : null}
      </div>
    </>
  )
}
