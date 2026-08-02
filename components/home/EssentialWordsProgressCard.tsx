'use client'

// Planned structure:
// <EssentialWordsProgressCard>
//   title + empty copy OR level progress + state-aware CTA
// </EssentialWordsProgressCard>

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight } from '@/components/icons'
import { db, ensureDbReady } from '@/lib/db'
import { ESSENTIAL_WORD_PREFIX } from '@/lib/essential-words/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { LevelProgressBreakdown } from './LevelProgressBreakdown'
import { cn } from '@/lib/cn'

const ESSENTIAL_WORD_TARGET = 2800
/** Below this, promote a stronger CTA — early-route signal, not a nav tile. */
const EARLY_PROGRESS_THRESHOLD = 50

export default function EssentialWordsProgressCard() {
  const { user } = useAuth()
  const learned = useLiveQuery(
    async () => {
      try {
        await ensureDbReady()
        if (!user?.id) return 0
        return db.srsData
          .filter((e) => e.userId === user.id && e.wordId.startsWith(ESSENTIAL_WORD_PREFIX))
          .count()
      } catch {
        return 0
      }
    },
    [user?.id],
  )

  if (learned === undefined) {
    return (
      <div className="home-sidebar-card flex flex-col gap-2" aria-hidden>
        <div className="h-3 w-16 animate-pulse rounded bg-surface-sunken" />
        <div className="h-5 w-40 animate-pulse rounded bg-surface-sunken" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-sunken" />
      </div>
    )
  }

  const early = learned < EARLY_PROGRESS_THRESHOLD
  const ctaLabel =
    learned === 0
      ? 'Empezar palabras esenciales'
      : early
        ? 'Seguir palabras esenciales'
        : 'Abrir palabras esenciales'

  if (learned === 0) {
    return (
      <Link
        href="/practice/essential-words"
        className="home-sidebar-card focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-label text-fg">Vocabulario</span>
        <span className="font-body-sm text-pretty text-fg-muted">Palabras esenciales</span>
        <span className="font-body-sm text-pretty text-fg-muted line-clamp-2">
          Las palabras más frecuentes del inglés, en un mazo progresivo.
        </span>
        <span
          className={cn(
            'mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm font-medium',
            'text-primary group-hover:underline',
          )}
        >
          {ctaLabel} <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    )
  }

  const ratio = Math.min(1, learned / ESSENTIAL_WORD_TARGET)

  return (
    <Link
      href="/practice/essential-words"
      className="home-sidebar-card focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
    >
      <span className="font-label text-fg">Vocabulario</span>
      <span className="font-body-sm text-pretty text-fg-muted">Palabras esenciales</span>
      <LevelProgressBreakdown fallbackRatio={ratio} />
      <span
        className={cn(
          'mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm',
          early
            ? 'font-medium text-primary group-hover:underline'
            : 'text-fg-muted group-hover:text-fg group-hover:underline',
        )}
      >
        {ctaLabel} <ArrowRight size={16} aria-hidden />
      </span>
    </Link>
  )
}
