'use client'

import Link from 'next/link'
import { Sparkles } from '@/components/icons'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { WordStrengthBars } from '@/components/vocabulary/words/WordStrengthBars'
import { getWordStrength } from '@/lib/word-bank/strength'
import { useReviewSession } from '@/hooks/useReviewSession'
import { ReviewSessionLauncher } from '@/components/practice/review/ReviewSessionLauncher'
import { ReviewSectionCard } from '@/components/practice/review/ReviewSectionCard'
import { ReviewHubActions } from '@/components/practice/review/ReviewHubActions'
import { SrsHistoryPanel } from '@/components/practice/review/SrsHistoryPanel'
import { SrsVault } from '@/components/practice/srs-vault/SrsVault'
import type { ReviewHubSummary } from '@/lib/review/types'

interface Props {
  summary: ReviewHubSummary
}

function formatIpa(ipa: string | null | undefined): string {
  if (!ipa) return ''
  return ipa.startsWith('/') ? ipa : `/${ipa.replace(/^\/|\/$/g, '')}/`
}

function overdueLabel(daysOverdue: number): string {
  if (daysOverdue > 0) {
    return daysOverdue === 1 ? '1 día de retraso' : `${daysOverdue} días de retraso`
  }
  return 'para hoy'
}

export function ReviewHubClient({ summary }: Props) {
  const { state, sessionKey, startReview, startFailedItem, startTopic, advanceStep, exitSession } =
    useReviewSession()
  const { counts } = summary
  const canStart = summary.canStartReview && state.phase !== 'loading'
  const showMomentum =
    state.phase === 'idle' && summary.canStartReview && counts.reviewable > 0
  const showAllClear = state.phase === 'idle' && summary.nothingDue

  return (
    <>
      <ReviewSessionLauncher
        state={state}
        sessionKey={sessionKey}
        onStepComplete={advanceStep}
        onExit={exitSession}
      />

      <div className="flex flex-col gap-4">
        {showMomentum ? (
          <div
            className={cn(
              'animate-message-in rounded-[var(--radius-lg)] border border-primary/20',
              'bg-primary-soft px-4 py-3',
            )}
          >
            <p className="m-0 font-body-sm text-fg">
              <span className="font-semibold tabular-nums text-primary">{counts.reviewable}</span>
              {' '}
              {counts.reviewable === 1 ? 'pendiente listo' : 'pendientes listos'} para repasar hoy
            </p>
          </div>
        ) : null}

        {showAllClear ? (
          <div
            className={cn(
              'animate-fadeIn flex flex-col items-center gap-2 rounded-[var(--radius-lg)]',
              'border border-border-subtle bg-surface-sunken px-4 py-5 text-center',
            )}
          >
            <Sparkles size={20} className="text-primary" aria-hidden />
            <p className="m-0 font-body-sm font-medium text-fg">Estás al día</p>
            <p className="m-0 max-w-[36ch] font-caption text-fg-muted">
              Nada pendiente en el hub — sigue con tu plan diario o explora sonidos nuevos.
            </p>
          </div>
        ) : null}

        <ReviewSectionCard
          title="Oraciones fallidas"
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
                    data-cuelume-press="press"
                    data-cuelume-release="release"
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
          emptyMessage="Ninguna palabra en aprendizaje — muy bien."
        >
          <ul className="flex flex-col gap-3">
            {summary.weakWords.slice(0, 4).map((w) => (
              <li key={w.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-medium text-fg">{w.text}</p>
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
          title="Vocabulario pendiente"
          count={counts.dueWords}
          emptyMessage="Nada de vocabulario para hoy."
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
            <Link
              href="/words"
              className="font-caption text-primary transition-opacity hover:opacity-80"
              data-cuelume-hover="tick"
            >
              Ver léxico →
            </Link>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Sonidos pendientes"
          count={counts.soundsDue}
          emptyMessage="Ningún contraste de fonema pendiente hoy."
        >
          <ul className="flex flex-col gap-2">
            {summary.soundsDue.slice(0, 4).map((s) => (
              <li key={`${s.soundId}-${s.ipa}`} className="font-body-sm text-fg">
                <span className="font-ipa text-primary">{formatIpa(s.ipa)}</span>
                {s.example ? (
                  <span className="ml-2 text-fg-secondary">{s.example}</span>
                ) : null}
                <span className="ml-2 font-caption text-fg-muted">
                  {overdueLabel(s.daysOverdue)}
                </span>
              </li>
            ))}
          </ul>
          {counts.soundsDue > 0 ? (
            <Link
              href="/practice/sounds"
              className="font-caption text-primary transition-opacity hover:opacity-80"
              data-cuelume-hover="tick"
            >
              Laboratorio de sonidos →
            </Link>
          ) : null}
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Conceptos pendientes"
          count={counts.dueTopics}
          emptyMessage="Nada de gramática pendiente hoy."
        >
          <ul className="flex flex-col gap-2">
            {summary.dueTopics.slice(0, 4).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-2 font-body-sm text-fg">
                {t.topic}<Button type="button" variant="ghost" size="sm" onClick={() => startTopic(t.topic)}>Practicar</Button>
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <ReviewSectionCard
          title="Conceptos débiles"
          count={counts.weakTopics}
          emptyMessage="Ningún concepto en aprendizaje."
        >
          <ul className="flex flex-col gap-2">
            {summary.weakTopics.slice(0, 4).map((t) => (
              <li key={t.id} className="font-body-sm text-fg">
                {t.topic}
              </li>
            ))}
          </ul>
        </ReviewSectionCard>

        <SrsHistoryPanel groups={summary.srsHistory} />

        <ReviewHubActions
          phase={state.phase}
          canStart={canStart}
          hadReviewableItems={counts.reviewable > 0}
          reviewableCount={counts.reviewable}
          onStartReview={startReview}
          onRetry={startReview}
        />

        {state.phase === 'idle' ? (
          <div className="flex justify-center pt-2">
            <SrsVault />
          </div>
        ) : null}

        {!summary.canStartReview && state.phase === 'idle' && !summary.nothingDue ? (
          <p className="font-body-sm text-center text-fg-muted animate-fadeIn">
            {counts.failedSentences > 0 && counts.reviewable === 0
              ? 'Hay errores en el historial, pero nada listo para repasar hoy. Sigue con tu plan diario.'
              : 'Nada listo para un repaso completo ahora. Practica en el plan diario para generar nuevos ítems.'}
          </p>
        ) : null}
      </div>
    </>
  )
}
