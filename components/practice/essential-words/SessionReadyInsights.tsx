'use client'

// Planned structure:
// <SessionReadyInsights>
//   <InsightCard label="Racha" />
//   <InsightCard label="Mañana" />
// </SessionReadyInsights>

import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'
import { SessionSurface } from './session-chrome'

interface Props {
  stats: EssentialWordsStats
  /** Real app-wide streak (Supabase-backed), fetched server-side and passed down. */
  streak: number
}

function InsightCard({ label, value }: { label: string; value: string }) {
  return (
    <SessionSurface className="gap-1 py-4">
      <span className="font-kicker text-fg-subtle">{label}</span>
      <span className="type-stat text-h3 tracking-tight text-fg">{value}</span>
    </SessionSurface>
  )
}

export function SessionReadyInsights({ stats, streak }: Props) {
  const streakLabel = `${streak} ${streak === 1 ? 'día' : 'días'}`
  const tomorrowLabel = `${stats.dueTomorrow} ${stats.dueTomorrow === 1 ? 'repaso' : 'repasos'}`

  return (
    <div className="grid grid-cols-2 gap-space-4 sm:gap-space-5">
      <InsightCard label="Racha" value={streakLabel} />
      <InsightCard label="Mañana" value={tomorrowLabel} />
    </div>
  )
}
