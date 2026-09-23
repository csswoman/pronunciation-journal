'use client'

// Planned structure:
// <ReviewHubClient>
//   <ReviewSessionRunner (deferred, active when user launches review)>
//   <ReviewHubBanner (momentum alert or all-clear banner)>
//   <PageDashboardMain (failed sentences, weak words, due vocabulary, sounds, topics, lessons, actions)>
//   <PageDashboardRail (SRS history, SRS vault)>
// </ReviewHubClient>

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { countDueChunks } from '@/lib/chunk-of-day/queries'
import { ReviewSectionCard } from '@/components/practice/review/ReviewSectionCard'
import { ReviewLessonSection } from '@/components/practice/review/ReviewLessonSection'
import { ReviewChunksSection } from '@/components/practice/review/ReviewChunksSection'
import { ReviewHubBanner } from '@/components/practice/review/ReviewHubBanner'
import { ReviewHubActions } from '@/components/practice/review/ReviewHubActions'
import { SrsVault } from '@/components/practice/srs-vault/SrsVault'
import type { ReviewHubSummary } from '@/lib/review/types'
import type { ReviewSessionAction } from './ReviewSessionRunner'
import { ReviewVocabularySections } from './ReviewVocabularySections'

const ReviewSessionRunner = dynamic(
  () => import('./ReviewSessionRunner').then((m) => m.ReviewSessionRunner),
  {
    loading: () => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base/80 backdrop-blur-xs text-fg-muted font-caption">
        Cargando sesión…
      </div>
    ),
  },
)

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
  const auth = useAuthOptional()
  const user = auth?.user ?? null
  const [activeSession, setActiveSession] = useState<ReviewSessionAction | null>(null)
  const [clientChunksDue, setClientChunksDue] = useState<number | null>(null)
  const isSessionActive = activeSession !== null

  useEffect(() => {
    if (!user) return
    let cancelled = false
    countDueChunks(user.id)
      .then((due) => {
        if (!cancelled) setClientChunksDue(due)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [user])

  const queueCounts = summary.queueCounts ?? summary.counts
  const initialChunks = queueCounts.chunksDue ?? 0
  const effectiveChunksDue =
    clientChunksDue !== null ? Math.max(clientChunksDue, initialChunks) : initialChunks
  const chunksDifference = effectiveChunksDue - initialChunks
  const totalReviewable = (queueCounts.executable ?? 0) + Math.max(0, chunksDifference)
  const elsewhereCount = queueCounts.elsewhere ?? 0

  const canStart = (totalReviewable > 0 || summary.canStartReview) && !isSessionActive
  const showMomentum = !isSessionActive && totalReviewable > 0
  const showAllClear = !isSessionActive && totalReviewable === 0 && summary.nothingDue

  return (
    <>
      {activeSession ? (
        <ReviewSessionRunner
          action={activeSession}
          summary={summary}
          onExit={() => setActiveSession(null)}
        />
      ) : null}

      <div className="page-dashboard">
        <ReviewHubBanner
          showMomentum={showMomentum}
          showAllClear={showAllClear}
          totalReviewable={totalReviewable}
          elsewhereCount={elsewhereCount}
        />

        <div className="page-dashboard__main">
          <ReviewSectionCard
            title="Oraciones fallidas"
            count={queueCounts.failedSentences}
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
                    {!item.drillable ? <span className="ml-2 font-caption text-fg-subtle">· solo historial</span> : null}
                  </div>
                  {item.drillable && !isSessionActive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-primary"
                      onClick={() => setActiveSession({ type: 'failed_item', item })}
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

          <ReviewVocabularySections summary={summary} />

          <ReviewChunksSection
            chunksCount={effectiveChunksDue}
            onStartReview={() => setActiveSession({ type: 'review' })}
          />

          <ReviewSectionCard
            title="Sonidos pendientes"
            count={queueCounts.soundsDue}
            emptyMessage="Ningún contraste de fonema pendiente hoy."
          >
            <ul className="flex flex-col gap-2">
              {summary.soundsDue.slice(0, 4).map((s) => (
                <li key={`${s.soundId}-${s.ipa}`} className="font-body-sm text-fg">
                  <span className="font-ipa text-primary">{formatIpa(s.ipa)}</span>
                  {s.example ? <span className="ml-2 text-fg-secondary">{s.example}</span> : null}
                  <span className="ml-2 font-caption text-fg-muted">{overdueLabel(s.daysOverdue)}</span>
                </li>
              ))}
            </ul>
            {queueCounts.soundsDue > 0 ? (
              <Link href="/practice/sounds" className="font-caption text-primary transition-opacity hover:opacity-80" data-cuelume-hover="tick">
                Laboratorio de sonidos →
              </Link>
            ) : null}
          </ReviewSectionCard>

          <ReviewSectionCard
            title="Conceptos pendientes"
            count={queueCounts.dueTopics}
            emptyMessage="Nada de gramática pendiente hoy."
          >
            <ul className="flex flex-col gap-2">
              {summary.dueTopics.slice(0, 4).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2 font-body-sm text-fg">
                  {t.topic}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveSession({ type: 'topic', topic: t.topic })}
                  >
                    Practicar
                  </Button>
                </li>
              ))}
            </ul>
          </ReviewSectionCard>

          <ReviewSectionCard
            title="Conceptos débiles"
            count={queueCounts.weakTopics}
            emptyMessage="Ningún concepto en aprendizaje."
          >
            <ul className="flex flex-col gap-2">
              {summary.weakTopics.slice(0, 4).map((t) => (
                <li key={t.id} className="font-body-sm text-fg">{t.topic}</li>
              ))}
            </ul>
          </ReviewSectionCard>

          <ReviewLessonSection
            lessons={summary.dueLessons}
            count={queueCounts.dueLessons}
          />

          <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised p-4">
            <div className="min-w-0">
              <h3 className="text-body-sm font-semibold text-fg">Contenido guardado</h3>
              <p className="text-caption text-fg-muted">Repasa las palabras y frases de tu lista personal</p>
            </div>
            <Link
              href="/tracking"
              className="focus-ring inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-border-subtle bg-surface-sunken px-3.5 text-caption font-semibold text-fg transition-colors hover:bg-surface-raised hover:border-border-default"
            >
              Ver guardadas →
            </Link>
          </div>

          <ReviewHubActions
            phase={isSessionActive ? 'loading' : 'idle'}
            canStart={canStart}
            hadReviewableItems={totalReviewable > 0}
            reviewableCount={totalReviewable}
            onStartReview={() => setActiveSession({ type: 'review' })}
            onRetry={() => setActiveSession({ type: 'review' })}
          />

          {!canStart && !isSessionActive && !showAllClear ? (
            <p className="font-body-sm text-center text-fg-muted animate-fadeIn">
              {queueCounts.failedSentences > 0 && totalReviewable === 0
                ? 'Hay errores en el historial, pero nada listo para repasar hoy. Sigue con tu plan diario.'
                : 'Nada listo para un repaso completo ahora. Practica en el plan diario para generar nuevos ítems.'}
            </p>
          ) : null}
        </div>

        <aside className="page-dashboard__rail" aria-label="Herramientas de repaso">
          {!isSessionActive ? <SrsVault /> : null}
        </aside>
      </div>
    </>
  )
}
