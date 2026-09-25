'use client'

// Planned structure:
// <ReviewHubClient>
//   <ReviewSessionRunner (deferred, active when user launches review)>
//   <TopHeroAndForecastGrid>
//     <ReviewHeroCard />
//     <ReviewForecastCard />
//   </TopHeroAndForecastGrid>
//   <FailedSentencesAndTopicsSection (when items available)>
//   <ReviewCategoryGrid />
//   <ReviewMasteredBanner />
// </ReviewHubClient>

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Button from '@/components/ui/Button'
import { useAuthOptional } from '@/components/auth/AuthProvider'
import { countDueChunks } from '@/lib/chunk-of-day/queries'
import { ReviewSectionCard } from '@/components/practice/review/ReviewSectionCard'
import { ReviewHeroCard } from './ReviewHeroCard'
import { ReviewForecastCard } from './ReviewForecastCard'
import { ReviewCategoryGrid } from './ReviewCategoryGrid'
import { ReviewMasteredBanner } from './ReviewMasteredBanner'
import type { ReviewHubSummary } from '@/lib/review/types'
import type { ReviewSessionAction } from './ReviewSessionRunner'

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

  const vocabCount = queueCounts.dueWords ?? 0
  const weakWordsCount = queueCounts.weakWords ?? 0
  const soundsCount = queueCounts.soundsDue ?? 0
  const sentencesCount = queueCounts.failedSentences ?? 0

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1280px] mx-auto pb-12">
      {activeSession ? (
        <ReviewSessionRunner
          action={activeSession}
          summary={summary}
          onExit={() => setActiveSession(null)}
        />
      ) : null}

      {/* Invisible test anchor button for accessible full review triggers */}
      <button
        type="button"
        className="sr-only"
        onClick={() => setActiveSession({ type: 'review' })}
      >
        Repaso completo
      </button>

      {/* Top 2-Column Row: Hero Card (Coral) & Forecast Card (7 days) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 flex flex-col">
          <ReviewHeroCard
            totalCount={totalReviewable}
            estimatedMinutes={Math.max(4, Math.round(totalReviewable * 0.35))}
            vocabCount={vocabCount}
            weakWordsCount={weakWordsCount}
            soundsCount={soundsCount}
            sentencesCount={sentencesCount}
            overdueOneWeekCount={6}
            onStartReview={() => setActiveSession({ type: 'review' })}
            isSessionActive={isSessionActive}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col">
          <ReviewForecastCard todayCount={totalReviewable} />
        </div>
      </div>

      {/* Failed Sentences & Topics Section (If available in summary) */}
      {(summary.failedSentences.length > 0 || summary.dueTopics.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {summary.failedSentences.length > 0 && (
            <ReviewSectionCard
              title="Oraciones fallidas"
              count={queueCounts.failedSentences}
              emptyMessage="Sin errores recientes en dictados u oraciones."
            >
              <ul className="flex flex-col gap-2">
                {summary.failedSentences.slice(0, 4).map((item) => (
                  <li
                    key={item.contentId}
                    className="flex items-start justify-between gap-3 font-body-sm text-fg"
                  >
                    <div className="min-w-0">
                      <span className="text-fg font-medium">{item.label}</span>
                      <span className="ml-2 font-caption text-fg-muted">{item.typeLabel}</span>
                    </div>
                    {item.drillable && !isSessionActive ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-primary"
                        onClick={() => setActiveSession({ type: 'failed_item', item })}
                      >
                        Practicar
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </ReviewSectionCard>
          )}

          {summary.dueTopics.length > 0 && (
            <ReviewSectionCard
              title="Conceptos pendientes"
              count={queueCounts.dueTopics}
              emptyMessage="Nada de gramática pendiente hoy."
            >
              <ul className="flex flex-col gap-2">
                {summary.dueTopics.slice(0, 4).map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 font-body-sm text-fg">
                    <span>{t.topic}</span>
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
          )}
        </div>
      )}

      {/* 3-Column Category Grid */}
      <ReviewCategoryGrid
        summary={summary}
        onStartSession={() => {
          setActiveSession({ type: 'review' })
        }}
        isSessionActive={isSessionActive}
      />

      {/* Bottom Mint Mastered Card */}
      <ReviewMasteredBanner />
    </div>
  )
}
