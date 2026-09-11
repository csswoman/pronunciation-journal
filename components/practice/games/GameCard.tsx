'use client'

// Planned structure:
// <GameCard> — one playable game tile (icon, title, description, Jugar CTA)

import Link from 'next/link'
import { ArrowRight, CloudRain, Grid2x2 } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'
import type { PracticeGame } from '@/lib/practice/practice-games'

/** Icons live here, not in the data module, which stays free of JSX. */
const GAME_ICONS: Record<string, typeof Grid2x2> = {
  'word-search': Grid2x2,
  'word-rain': CloudRain,
}

interface GameCardProps {
  game: PracticeGame
}

export default function GameCard({ game }: GameCardProps) {
  const Icon = GAME_ICONS[game.id] ?? Grid2x2

  return (
    <Link
      href={game.href}
      onClick={() => void setLastPracticeMode(game.modeId)}
      className="group/game flex flex-col justify-between gap-4 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-sm active:scale-[0.99] focus-ring"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border-subtle bg-surface-sunken text-primary transition-colors group-hover/game:border-primary/30">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-h3 font-bold text-fg transition-colors group-hover/game:text-primary">
              {game.title}
            </h2>
            <span className="font-mono text-tiny text-fg-subtle">
              ({game.englishTitle})
            </span>
          </div>
          <p className="text-body-sm text-fg-muted text-pretty">
            {game.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 font-caption text-tiny font-medium text-on-primary shadow-xs transition-all duration-200 group-hover/game:bg-primary-hover">
          Jugar
          <ArrowRight
            size={12}
            className="transition-transform duration-200 group-hover/game:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  )
}
