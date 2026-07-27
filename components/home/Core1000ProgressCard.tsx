'use client'

// Planned structure:
// <Core1000ProgressCard>
//   kicker + title + milestone copy
//   quiet progress wash / level rows
// </Core1000ProgressCard>

import Link from 'next/link'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight } from '@/components/icons'
import { db, ensureDbReady } from '@/lib/db'
import { CORE1000_PREFIX } from '@/lib/core-1000/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { LevelProgressBreakdown } from './LevelProgressBreakdown'

const CORE_1000_TARGET = 1000

function milestoneLabel(learned: number): string {
  if (learned < 50) return 'Primeras palabras'
  if (learned < 200) return 'Base en marcha'
  if (learned < 500) return 'Mitad del camino cerca'
  if (learned < CORE_1000_TARGET) return 'Casi el mazo completo'
  return 'Mazo completo'
}

export default function Core1000ProgressCard() {
  const { user } = useAuth()
  const learned = useLiveQuery(
    async () => {
      try {
        await ensureDbReady()
        if (!user?.id) return 0
        return db.srsData
          .filter((e) => e.userId === user.id && e.wordId.startsWith(CORE1000_PREFIX))
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

  if (learned === 0) {
    return (
      <Link
        href="/practice/essential-words"
        className="home-sidebar-card focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
      >
        <span className="font-kicker text-fg-subtle">Vocabulario</span>
        <span className="text-h4 text-balance text-fg">Palabras esenciales</span>
        <span className="font-body-sm text-pretty text-fg-muted line-clamp-2">
          Las mil palabras más frecuentes del inglés, en un mazo progresivo.
        </span>
        <span className="mt-auto inline-flex min-h-10 items-center gap-1.5 font-body-sm text-fg-muted group-hover:text-fg group-hover:underline">
          Abrir mazo <ArrowRight size={16} aria-hidden />
        </span>
      </Link>
    )
  }

  const ratio = Math.min(1, learned / CORE_1000_TARGET)

  return (
    <Link
      href="/practice/essential-words"
      className="home-sidebar-card focus-ring group flex flex-col gap-2 transition-colors hover:bg-surface-sunken"
    >
      <span className="font-kicker text-fg-subtle">Vocabulario</span>
      <span className="text-h4 text-balance text-fg">Palabras esenciales</span>
      <span className="font-body-sm text-pretty text-fg-muted">
        {milestoneLabel(learned)}
      </span>
      <LevelProgressBreakdown fallbackRatio={ratio} />
    </Link>
  )
}
