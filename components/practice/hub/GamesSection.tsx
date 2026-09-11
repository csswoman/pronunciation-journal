'use client'

// Planned structure:
// <GamesSection> — "Juegos de vocabulario" bento card
//   Header (kicker "lúdico", title, available count badge)
//   GamePreviewList (one row per playable game, from PRACTICE_GAMES)
//   Footer link → /practice/games
// </GamesSection>

import Link from 'next/link'
import { ArrowRight, CloudRain, Grid2x2 } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import { getIllustration } from '@/lib/illustrations/registry'
import { PRACTICE_GAMES, UPCOMING_GAMES } from '@/lib/practice/practice-games'

const GAME_ICONS: Record<string, typeof Grid2x2> = {
  'word-search': Grid2x2,
  'word-rain': CloudRain,
}

const Illustration = getIllustration('stateCompletado')

export default function GamesSection() {
  return (
    <div className="group relative flex flex-col justify-between gap-5 overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm">
      <div className="flex flex-col gap-4 z-10">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">
              juego
            </span>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-caption text-tiny font-medium text-primary">
              {PRACTICE_GAMES.length} disponibles
            </span>
          </div>
          <h2 className="text-h3 font-bold text-fg">Juegos de vocabulario</h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Mecánicas ágiles para acelerar la velocidad de reconocimiento y retención.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {PRACTICE_GAMES.map((game) => {
            const Icon = GAME_ICONS[game.id] ?? Grid2x2
            return (
              <Link
                key={game.id}
                href={game.href}
                onClick={() => void setLastPracticeMode(game.modeId)}
                className="group/game flex flex-col justify-between gap-3.5 rounded-xl border border-border-subtle bg-surface-sunken/60 p-3.5 md:p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-sunken active:scale-[0.99] focus-ring"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-primary shadow-2xs group-hover/game:border-primary/30 transition-colors">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-semibold text-fg group-hover/game:text-primary transition-colors">
                        {game.title}
                      </span>
                      <span className="font-mono text-tiny text-fg-subtle hidden xs:inline">
                        ({game.englishTitle})
                      </span>
                    </div>
                    <p className="text-body-xs text-fg-muted">{game.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-end shrink-0 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-on-primary px-3 py-1.5 font-caption text-tiny font-medium shadow-xs transition-all duration-200 group-hover/game:bg-primary-hover">
                    <span className="text-on-primary">Jugar</span>
                    <ArrowRight
                      size={12}
                      className="transition-transform duration-200 group-hover/game:translate-x-0.5 text-on-primary"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Próximos juegos */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle/60">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/practice/games"
            className="inline-flex items-center gap-1.5 font-caption text-tiny font-medium text-primary transition-opacity hover:opacity-80 focus-ring rounded"
          >
            Ver todos los juegos
            <ArrowRight size={12} aria-hidden="true" />
          </Link>
          <span className="font-caption text-tiny text-fg-subtle">Próximamente</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {UPCOMING_GAMES.map((game) => (
            <span
              key={game.id}
              className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken/40 px-2 py-0.5 font-mono text-tiny text-fg-subtle opacity-75"
            >
              {game.title}
            </span>
          ))}
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-4 bottom-3 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-16 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </div>
  )
}
