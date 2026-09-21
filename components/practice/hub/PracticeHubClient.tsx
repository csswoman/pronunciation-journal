'use client'

// Planned structure:
// <PracticeHubClient>
//   <PracticeHubHeader filter={activeFilter} onFilterChange={setActiveFilter} />
//   <PracticeOptionsGrid recommendation={recommendation} ... />
// </PracticeHubClient>

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import PageLayout from '@/components/layout/PageLayout'
import { loadCachedDailyPlan } from '@/lib/daily/plan-storage'
import { getLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { countWordsDueForReviewClient } from '@/lib/word-bank/queries'
import { fetchAggregatedReviewSummaryClient } from '@/lib/review/client-queries'
import { countDueChunks } from '@/lib/chunk-of-day/queries'
import { getEssentialWordsLevelCount } from '@/lib/essential-words/level-count'
import { getEffectiveLearnerLevelForViewer } from '@/lib/learner-level/client-queries'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'
import { loadWatchedImmersionLessonIds } from '@/lib/immersion/progress-queries'
import { resolveRecommendedMode, type RecommendedResult } from '@/lib/practice/practice-modes'
import { emptyPracticeHubData, type PracticeHubData } from '@/lib/practice/hub-data-types'
import PracticeHubHeader, { type PracticeFilter } from './PracticeHubHeader'
import PracticeOptionsGrid from './PracticeOptionsGrid'

interface Props {
  fromDaily: boolean
  serverData?: PracticeHubData
}

export default function PracticeHubClient({ fromDaily, serverData }: Props) {
  const { user } = useAuth()
  const hubData = serverData ?? emptyPracticeHubData()
  const [activeFilter, setActiveFilter] = useState<PracticeFilter>('all')
  const [recommendation, setRecommendation] = useState<RecommendedResult>(() =>
    resolveRecommendedMode({ fromDaily: false, arc: undefined, lastModeId: null }),
  )
  const [arc, setArc] = useState<import('@/lib/practice/types').SessionArc | undefined>(undefined)
  const [essentialWordsDueCount, setEssentialWordsDueCount] = useState<number | null>(null)
  const [vocabLearnedCount, setVocabLearnedCount] = useState<number | null>(null)
  const [vocabTotalCount, setVocabTotalCount] = useState<number | null>(null)
  const [immersionWatchedCount, setImmersionWatchedCount] = useState<number | null>(null)
  const [activityUnavailable, setActivityUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      const arc = fromDaily && user ? (loadCachedDailyPlan(user.id)?.arc ?? undefined) : undefined
      // Dexie may be unavailable (private mode / no IndexedDB) — fall back to null.
      const [lastModeResult, reviewResult] = await Promise.all([
        fromDaily
          ? Promise.resolve({ value: null, failed: false })
          : getLastPracticeMode()
              .then((value) => ({ value, failed: false }))
              .catch(() => ({ value: null, failed: true })),
        user
          ? Promise.all([
              hubData.reviewSummary
                ? Promise.resolve(hubData.reviewSummary)
                : fetchAggregatedReviewSummaryClient(user.id),
              countDueChunks(user.id).catch(() => 0),
            ])
              .then(([serverSummary, chunksDue]) => {
                const previousChunks = serverSummary.queueCounts.chunksDue ?? 0
                const totalDue = serverSummary.totalDue - previousChunks + chunksDue
                const summary = {
                  ...serverSummary,
                  hasPendingReview: totalDue > 0,
                  totalDue,
                  queueCounts: {
                    ...serverSummary.queueCounts,
                    chunksDue,
                    reviewable: totalDue,
                    total: totalDue,
                  },
                }
                return { summary, dueCount: summary.queueCounts.dueWords, failed: false }
              })
              .catch(async () => {
                try {
                  const dueCount = await countWordsDueForReviewClient(user.id)
                  return { summary: null, dueCount, failed: false }
                } catch {
                  return { summary: null, dueCount: null, failed: true }
                }
              })
          : Promise.resolve({ summary: null, dueCount: null, failed: false }),
      ])
      const lastModeId = lastModeResult.value
      const reviewSummary = reviewResult.summary
      const nextDueCount = reviewResult.dueCount
      // `fromDaily` but the cached plan is gone (e.g. fresh tab): treat as neutral.
      const effectiveFromDaily = fromDaily && !!arc
      const result = resolveRecommendedMode({
        fromDaily: effectiveFromDaily,
        arc,
        lastModeId,
        dueCount: nextDueCount,
        reviewSummary,
      })
      if (!cancelled) {
        setArc(arc)
        setActivityUnavailable(lastModeResult.failed || reviewResult.failed)
        setRecommendation(result)
      }

      // Level-scoped vocabulary counts for the essential-words card.
      const viewerUserId = isAnonymousUser(user) ? null : user?.id ?? null
      const studyLevel = (await getEffectiveLearnerLevelForViewer(viewerUserId)).level
      const vocabCount = await getEssentialWordsLevelCount(
        studyLevel ? [studyLevel === 'C2' ? 'C1' : studyLevel] : null,
        user?.id,
      )
      if (!cancelled) {
        setVocabLearnedCount(vocabCount?.learned ?? null)
        setVocabTotalCount(vocabCount?.total ?? null)
        setEssentialWordsDueCount(vocabCount?.due ?? null)
      }

      // Immersion "watched" count is Dexie-backed (offline-first); the total
      // comes from the server bundle.
      if (user) {
        try {
          const watched = await loadWatchedImmersionLessonIds(user.id)
          if (!cancelled) setImmersionWatchedCount(watched.size)
        } catch {
          if (!cancelled) setImmersionWatchedCount(null)
        }
      }
    }
    void resolve()
    return () => {
      cancelled = true
    }
  }, [fromDaily, user])

  return (
    <PageLayout archetype="catalog" className="practice-hub">
      <PracticeHubHeader
        fromDaily={fromDaily}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />
      <div className="flex flex-col gap-5">
        {activityUnavailable && (
          <p role="status" className="font-caption text-fg-muted">
            No pudimos cargar tu actividad reciente. Aún puedes empezar esta práctica o elegir otra.
          </p>
        )}
        <PracticeOptionsGrid
          activeFilter={activeFilter}
          recommendation={recommendation}
          essentialWordsDueCount={essentialWordsDueCount}
          vocabLearnedCount={vocabLearnedCount}
          vocabTotalCount={vocabTotalCount}
          arc={arc}
          hubData={hubData}
          immersionWatchedCount={immersionWatchedCount}
        />
      </div>
    </PageLayout>
  )
}
