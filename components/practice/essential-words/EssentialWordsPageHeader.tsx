'use client'

import { useState } from 'react'
import { Search, X } from '@/components/icons'
import { SearchModal } from '@/components/search/SearchModal'
import { SessionReadyRouteChips } from './SessionReadyRouteChips'
import { essentialWordsHeaderStatsLine } from '@/lib/essential-words/header-stats'
import type { EssentialWordsPhase, EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

interface Props {
  phase: EssentialWordsPhase
  stats: EssentialWordsStats
  speaking: boolean
  onExit: () => void
  activeRouteId?: string | null
  onRouteChange?: (routeId: string | null) => void
  subtitle?: string
}

export function EssentialWordsPageHeader({
  phase,
  stats,
  speaking,
  onExit,
  activeRouteId,
  onRouteChange,
  subtitle,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false)

  if (speaking) {
    return (
      <div className="flex items-center justify-end py-2">
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir de la práctica"
          className="flex size-11 items-center justify-center rounded-full text-fg-muted hover:bg-surface-raised hover:text-fg transition-colors cursor-pointer"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
    )
  }

  const headerSubtitle =
    subtitle ??
    (phase === 'loading'
      ? 'Preparando tu sesión de hoy'
      : phase === 'ready'
        ? 'Las 2800 palabras más frecuentes del inglés, con repaso espaciado.'
        : essentialWordsHeaderStatsLine(stats.learned, stats.totalWords, stats.dueCount))

  return (
    <>
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 sm:pb-6 pt-2">
        <div>
          <span className="block text-xs font-semibold tracking-wider text-fg-muted uppercase">
            Práctica
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-fg tracking-tight mt-1">
            Palabras esenciales
          </h1>
          <p className="text-sm sm:text-base text-fg-muted mt-1">
            {headerSubtitle}
          </p>
        </div>

        {phase === 'ready' && (
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            {onRouteChange && (
              <div className="min-w-[160px] sm:min-w-[180px]">
                <SessionReadyRouteChips
                  activeRouteId={activeRouteId ?? null}
                  onRouteChange={onRouteChange}
                  align="right"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-surface-raised border border-border-default hover:bg-surface-sunken hover:border-border-muted text-fg text-xs sm:text-sm font-semibold px-4 py-2 sm:py-2.5 transition-colors shadow-xs cursor-pointer"
            >
              <Search size={15} className="text-fg-muted shrink-0" aria-hidden />
              Buscar palabras
            </button>
          </div>
        )}
      </header>

      {searchOpen && (
        <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  )
}
