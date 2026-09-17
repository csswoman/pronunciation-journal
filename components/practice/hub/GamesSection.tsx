'use client'

// Planned structure:
// <GamesSection> — "Juegos de vocabulario" dark surface card
//   Header: JUEGO kicker + "2 disponibles" outline badge
//   Title: Juegos de vocabulario + subtitle "Reconoce más rápido, retén mejor."
//   MiniCards: Sopa de letras (butter) & Lluvia de palabras (lilac)
//   Footer: Upcoming chips (Word Chain, Chunk Duel) + "Próximamente"
// </GamesSection>

import Link from 'next/link'
import { CloudRain, Grid2x2 } from '@/components/icons'
import PastelCard from '@/components/layout/PastelCard'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { PRACTICE_GAMES, UPCOMING_GAMES } from '@/lib/practice/practice-games'

const GAME_TONES: Record<string, 'butter' | 'lilac'> = {
  'word-search': 'butter',
  'word-rain': 'lilac',
}

const GAME_ICONS: Record<string, typeof Grid2x2> = {
  'word-search': Grid2x2,
  'word-rain': CloudRain,
}

export default function GamesSection() {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted select-none">
            JUEGO
          </span>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-3 py-0.5 font-sans text-caption font-bold text-fg-muted">
            {PRACTICE_GAMES.length} disponibles
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-fg leading-tight">
            Juegos de vocabulario
          </h2>
          <p className="font-sans text-body-sm text-fg-muted text-pretty">
            Reconoce más rápido, retén mejor.
          </p>
        </div>

        {/* Mini Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
          {PRACTICE_GAMES.map((game) => {
            const tone = GAME_TONES[game.id] ?? 'butter'
            const Icon = GAME_ICONS[game.id] ?? Grid2x2
            return (
              <Link
                key={game.id}
                href={game.href}
                onClick={() => void setLastPracticeMode(game.modeId)}
                className="group/game focus-ring rounded-2xl block"
              >
                <PastelCard
                  tone={tone}
                  className="rounded-2xl p-3.5 flex flex-col justify-between gap-2.5 min-h-[92px] transition-transform duration-150 group-hover/game:-translate-y-0.5"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/10 text-ink shrink-0">
                    <Icon size={16} aria-hidden="true" />
                  </div>
                  <h3 className="font-heading text-body-md font-bold text-ink leading-snug mt-auto">
                    {game.title}
                  </h3>
                </PastelCard>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Próximos juegos footer */}
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
    </div>
  )
}

