// Planned structure:
// <GamesSection>
//   <PracticeCategoryLane title kicker description>
//     static game cards with "Próximamente" badges (no fake hover pointer)
//   </PracticeCategoryLane>
// </GamesSection>

import { Zap, Flame, BrainCircuit, Trophy } from '@/components/icons'
import PracticeCategoryLane from './PracticeCategoryLane'
import { PRACTICE_CATEGORIES, PRACTICE_GAMES } from '@/lib/practice/practice-categories'
import type { ElementType } from 'react'

const GAME_ICONS: Record<string, ElementType> = {
  Zap,
  Flame,
  BrainCircuit,
  Trophy,
}

export default function GamesSection() {
  const category = PRACTICE_CATEGORIES.games

  return (
    <PracticeCategoryLane
      title={category.title}
      kicker={category.kicker}
      description={category.description}
    >
      {PRACTICE_GAMES.map((game) => {
        const Icon = GAME_ICONS[game.icon] ?? Zap
        return (
          <div
            key={game.id}
            className="flex shrink-0 w-[72vw] max-w-[240px] md:w-auto md:max-w-none snap-start flex-col justify-between gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-sunken/50 p-3.5 opacity-85"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-[var(--radius-md)] bg-surface-base text-fg-subtle">
                <Icon size={16} aria-hidden />
              </span>
              <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-base px-2 py-0.5 font-caption text-tiny font-medium text-fg-muted">
                Próximamente
              </span>
            </div>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="font-label text-body-sm font-semibold text-fg">
                  {game.title}
                </span>
                <span className="font-caption text-tiny text-fg-subtle">{game.tag}</span>
              </div>
              <p className="font-caption text-tiny text-fg-subtle">
                {game.description}
              </p>
            </div>
          </div>
        )
      })}
    </PracticeCategoryLane>
  )
}
