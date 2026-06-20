'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import PageLayout from '@/components/layout/PageLayout'
import { loadCachedDailyPlan } from '@/lib/daily/plan-storage'
import { getLastPracticeMode } from '@/lib/db'
import { resolveRecommendedMode, type RecommendedResult } from '@/lib/practice/practice-modes'
import PracticeHubHeader from './PracticeHubHeader'
import RecommendedPracticeCard from './RecommendedPracticeCard'
import PracticeOptionsGrid from './PracticeOptionsGrid'

// Planned structure:
// <PracticeHubClient>
//   <PracticeHubHeader />
//   <RecommendedPracticeCard />
//   <PracticeOptionsGrid />

interface Props {
  fromDaily: boolean
}

export default function PracticeHubClient({ fromDaily }: Props) {
  const { user } = useAuth()
  const [recommendation, setRecommendation] = useState<RecommendedResult | null>(null)

  useEffect(() => {
    let cancelled = false
    async function resolve() {
      const arc = fromDaily && user ? (loadCachedDailyPlan(user.id)?.arc ?? undefined) : undefined
      // Dexie may be unavailable (private mode / no IndexedDB) — fall back to null.
      const lastModeId = fromDaily ? null : await getLastPracticeMode().catch(() => null)
      // `fromDaily` but the cached plan is gone (e.g. fresh tab): treat as neutral.
      const effectiveFromDaily = fromDaily && !!arc
      const result = resolveRecommendedMode({
        fromDaily: effectiveFromDaily,
        arc,
        lastModeId,
      })
      if (!cancelled) setRecommendation(result)
    }
    void resolve()
    return () => {
      cancelled = true
    }
  }, [fromDaily, user])

  return (
    <PageLayout className="mx-auto flex max-w-[640px] flex-col gap-6">
      <PracticeHubHeader fromDaily={fromDaily} />
      {recommendation && (
        <>
          <RecommendedPracticeCard recommendation={recommendation} />
          <PracticeOptionsGrid excludeModeId={recommendation.mode.id} />
        </>
      )}
    </PageLayout>
  )
}
