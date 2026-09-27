'use client'

// Planned structure:
// <GamesSection> — "Juegos de práctica" dark surface card
//   Header: JUEGO kicker + "{count} disponibles" outline badge
//   Title: Juegos de práctica + subtitle
//   MiniCards: Grid of available games dynamically rendered from PRACTICE_GAMES
//   Footer: Upcoming chips (Word Chain) + "Próximamente"
// </GamesSection>

import Link from 'next/link'
import { CloudRain, Grid2x2, Radio, Volume2, Zap, Target, Layers } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { PRACTICE_GAMES, UPCOMING_GAMES } from '@/lib/practice/practice-games'

const GAME_ICONS: Record<string, typeof Grid2x2> = {
  'word-search': Grid2x2,
  'word-rain': CloudRain,
  'phoneme-invaders': Radio,
  'weak-form-catcher': Volume2,
  'chunk-duel': Zap,
  'false-friends-swipe': Target,
  'memory-match': Layers,
}

export default function GamesSection() {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted select-none">
            JUEGOS DE PRÁCTICA
          </span>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-3 py-0.5 font-sans text-caption font-bold text-fg-muted">
            {PRACTICE_GAMES.length} disponibles
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-fg leading-tight">
            Juegos de práctica
          </h2>
          <p className="font-sans text-body-sm text-fg-muted text-pretty">
            Reconoce más rápido, entrena el oído y retén mejor el vocabulario.
          </p>
        </div>

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {PRACTICE_GAMES.map((game) => {
            const Icon = GAME_ICONS[game.id] ?? Grid2x2
            return (
              <Link
                key={game.id}
                href={game.href}
                onClick={() => void setLastPracticeMode(game.modeId)}
                className="group/game focus-ring rounded-2xl block min-w-0"
              >
                <PastelCard
                  tone={game.tone}
                  className="rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 min-h-[96px] transition-transform duration-150 group-hover/game:-translate-y-0.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/10 text-ink shrink-0">
                      <Icon size={16} aria-hidden="true" />
                    </div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70 truncate text-right min-w-0 flex-1">
                      {game.kicker}
                    </span>
                  </div>
                  <h3 className="font-heading text-body-md font-bold text-ink leading-snug mt-auto min-w-0 line-clamp-2">
                    {game.title}
                  </h3>
                </PastelCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Próximos juegos footer */}
      {UPCOMING_GAMES.length > 0 && (
        <div className="flex items-center justify-between gap-2 pt-1 z-10 select-none">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {UPCOMING_GAMES.map((game) => (
              <span
                key={game.id}
                className="inline-flex shrink-0 items-center rounded-full border border-border-subtle bg-surface-sunken/60 px-2.5 py-0.5 font-sans text-tiny font-semibold text-fg-muted whitespace-nowrap"
              >
                {game.title}
              </span>
            ))}
          </div>
          <span className="font-sans text-caption font-semibold text-fg-subtle shrink-0">
            Próximamente
          </span>
        </div>
      )}
    </div>
  )
}
