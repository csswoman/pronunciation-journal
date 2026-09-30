'use client'

// Planned structure:
// <GameSessionBar title progressLabel="Oleada N">
//   <StreakBadge />
//   <ShieldMeter />
//   <GameSessionStat label="Puntos" />
// </GameSessionBar>

import { Flame, Heart } from '@/components/icons'
import { cn } from '@/lib/cn'
import GameSessionBar, { GameSessionStat } from '@/components/practice/games/shared/GameSessionBar'

interface InvadersHudProps {
  score: number
  wave: number
  streak: number
  shields: number
  maxShields: number
}

export default function InvadersHud({ score, wave, streak, shields, maxShields }: InvadersHudProps) {
  return (
    <GameSessionBar title="Phoneme Invaders" progressLabel={`Oleada ${wave}`}>
      {streak >= 3 && (
        <span className="hidden items-center gap-1 rounded-full bg-butter-soft px-2.5 py-1 font-sans text-caption font-bold tabular-nums text-ink sm:inline-flex">
          <Flame size={14} aria-hidden />
          Racha {streak}
        </span>
      )}

      <div className="flex items-center gap-0.5" role="img" aria-label={`${shields} de ${maxShields} escudos`}>
        {Array.from({ length: maxShields }).map((_, i) => (
          <Heart
            key={i}
            size={18}
            aria-hidden
            className={cn(
              'transition-opacity duration-200',
              i < shields ? 'fill-error text-error' : 'text-fg-faint opacity-60',
            )}
          />
        ))}
      </div>

      <GameSessionStat label="Puntos" value={score} />
    </GameSessionBar>
  )
}
