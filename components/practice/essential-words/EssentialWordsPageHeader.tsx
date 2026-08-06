'use client'

// Planned structure:
// <EssentialWordsPageHeader>
//   <PageHeader />  — kicker, title, subtitle (deck progress)
// </EssentialWordsPageHeader>

import PageHeader from '@/components/layout/PageHeader'
import { X } from '@/components/icons'
import { essentialWordsHeaderStatsLine } from '@/lib/essential-words/header-stats'
import type { EssentialWordsPhase, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

interface Props {
  phase: EssentialWordsPhase
  stats: EssentialWordsStats
  speaking: boolean
  onExit: () => void
}

export function EssentialWordsPageHeader({ phase, stats, speaking, onExit }: Props) {
  if (speaking) {
    return (
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir de la práctica"
          className="flex size-11 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-raised hover:text-fg-muted"
        >
          <X size={16} aria-hidden />
        </button>
      </div>
    )
  }

  const subtitle =
    phase === 'loading'
      ? 'Preparando tu sesión de hoy'
      : phase === 'ready'
        ? undefined
        : essentialWordsHeaderStatsLine(stats.learned, stats.totalWords, stats.dueCount)

  return (
    <PageHeader
      kicker="Práctica"
      title="Palabras esenciales"
      subtitle={subtitle}
      className="!pb-0"
    />
  )
}
