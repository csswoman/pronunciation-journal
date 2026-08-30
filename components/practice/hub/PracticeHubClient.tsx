'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import PageLayout from '@/components/layout/PageLayout'
import { loadCachedDailyPlan } from '@/lib/daily/plan-storage'
import { getLastPracticeMode } from '@/lib/db'
import { countWordsDueForReviewClient } from '@/lib/word-bank/queries'
import { resolveRecommendedMode, type RecommendedResult } from '@/lib/practice/practice-modes'
import PracticeHubHeader from './PracticeHubHeader'
import RecommendedPracticeCard from './RecommendedPracticeCard'
import PracticeOptionsGrid from './PracticeOptionsGrid'

interface Props {
  fromDaily: boolean
}

export default function PracticeHubClient({ fromDaily }: Props) {
  const { user } = useAuth()
  const [recommendation, setRecommendation] = useState<RecommendedResult>(() =>
    resolveRecommendedMode({ fromDaily: false, arc: undefined, lastModeId: null }),
  )
  const [arc, setArc] = useState<import('@/lib/practice/types').SessionArc | undefined>(undefined)
  const [dueCount, setDueCount] = useState<number | null>(null)
  const [activityUnavailable, setActivityUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      const arc = fromDaily && user ? (loadCachedDailyPlan(user.id)?.arc ?? undefined) : undefined
      // Dexie may be unavailable (private mode / no IndexedDB) — fall back to null.
      const [lastModeResult, dueResult] = await Promise.all([
        fromDaily
          ? Promise.resolve({ value: null, failed: false })
          : getLastPracticeMode()
              .then((value) => ({ value, failed: false }))
              .catch(() => ({ value: null, failed: true })),
        user
          ? countWordsDueForReviewClient(user.id)
              .then((value) => ({ value, failed: false }))
              .catch(() => ({ value: null, failed: true }))
          : Promise.resolve({ value: null, failed: false }),
      ])
      const lastModeId = lastModeResult.value
      const nextDueCount = dueResult.value
      // `fromDaily` but the cached plan is gone (e.g. fresh tab): treat as neutral.
      const effectiveFromDaily = fromDaily && !!arc
      const result = resolveRecommendedMode({
        fromDaily: effectiveFromDaily,
        arc,
        lastModeId,
        dueCount: nextDueCount,
      })
      if (!cancelled) {
        setArc(arc)
        setDueCount(nextDueCount)
        setActivityUnavailable(lastModeResult.failed || dueResult.failed)
        setRecommendation(result)
      }
    }
    void resolve()
    return () => {
      cancelled = true
    }
  }, [fromDaily, user])

  return (
    <PageLayout archetype="catalog" className="practice-hub">
      <PracticeHubHeader fromDaily={fromDaily} />
      <div className="flex flex-col gap-6">
        <section className="practice-hub__suggestion layout-stack-tight">
          <RecommendedPracticeCard recommendation={recommendation} />
          {activityUnavailable && (
            <p role="status" className="font-caption text-fg-muted">
              No pudimos cargar tu actividad reciente. Aún puedes empezar esta práctica o elegir otra.
            </p>
          )}
        </section>

        <PracticeOptionsGrid dueCount={dueCount} arc={arc} />
      </div>
    </PageLayout>
  )
}
