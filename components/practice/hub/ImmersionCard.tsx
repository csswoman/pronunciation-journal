'use client'

// Planned structure:
// <ImmersionCard> — "Inmersión y conversación" compact bar card
//   Mint Icon Badge (Headphones icon in mint circular container)
//   Content (Level 1 kicker "INMERSIÓN", title, watched count or tags)
//   Right action arrow CTA
// </ImmersionCard>

import Link from 'next/link'
import { Headphones, ArrowRight } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'

interface Props {
  /** Dexie-backed count of lessons watched. null = unavailable/offline. */
  watchedCount: number | null
  /** Total immersion lessons available (from the server bundle). */
  totalCount: number
}

export default function ImmersionCard({ watchedCount, totalCount }: Props) {
  const hasProgress = watchedCount !== null && totalCount > 0

  return (
    <Link
      href="/practice/immersion"
      onClick={() => void setLastPracticeMode('immersion')}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm focus-ring overflow-hidden"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-mint text-ink font-bold shadow-xs">
          <Headphones size={22} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="font-heading text-body-lg font-bold text-fg group-hover:text-primary transition-colors truncate">
            Inmersión y conversación
          </h2>
          <p className="font-sans text-body-xs text-fg-muted truncate">
            {hasProgress
              ? `${watchedCount} de ${totalCount} lecciones vistas`
              : 'Lecciones en video con nativos y fonética'}
          </p>
        </div>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-sunken text-fg group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition-colors">
        <ArrowRight size={16} aria-hidden="true" />
      </div>
    </Link>
  )
}

