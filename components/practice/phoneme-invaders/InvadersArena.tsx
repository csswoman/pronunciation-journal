'use client'

// Planned structure:
// <InvadersArena>
//   <RepeatButton />
//   <LaneGrid>
//     <Lane key={lane}>
//       <InvaderShipButton ship lane onShoot />
//       <LaneKeyHint />
//     </Lane>
//   </LaneGrid>
//   <GroundLine />
// </InvadersArena>

import { useEffect } from 'react'
import type { InvaderShip } from '@/lib/games/phoneme-invaders/engine'
import { cn } from '@/lib/cn'
import { Volume2 } from '@/components/icons'

interface InvadersArenaProps {
  ships: InvaderShip[]
  laneCount: number
  paused: boolean
  onShoot: (shipId: string) => void
  onRepeatAudio: () => void
}

const LANE_COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

/**
 * Space a ship cannot enter: its own height plus the ground strip with the
 * key hints. y=100 (landed) puts the ship's bottom edge right on the ground.
 */
const SHIP_TRAVEL_INSET = '7.75rem'

function shipTop(y: number): string {
  const progress = Math.min(1, Math.max(0, y / 100))
  return `calc((100% - ${SHIP_TRAVEL_INSET}) * ${progress.toFixed(4)})`
}

export default function InvadersArena({
  ships,
  laneCount,
  paused,
  onShoot,
  onRepeatAudio,
}: InvadersArenaProps) {
  useEffect(() => {
    if (paused) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'r' || e.key === 'R') {
        onRepeatAudio()
        return
      }
      const keyNum = Number.parseInt(e.key, 10)
      if (keyNum >= 1 && keyNum <= laneCount) {
        const shipInLane = ships.find((s) => s.lane === keyNum - 1)
        if (shipInLane) onShoot(shipInLane.id)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ships, laneCount, paused, onShoot, onRepeatAudio])

  return (
    <section
      aria-label="Zona de juego"
      className="relative flex h-96 w-full flex-col overflow-hidden rounded-3xl border border-border-subtle bg-surface-sunken sm:h-110"
    >
      <div className="relative z-10 flex justify-center pt-3">
        <button
          type="button"
          onClick={onRepeatAudio}
          disabled={paused}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border-default bg-surface-raised px-4 font-sans text-body-sm font-bold text-fg transition-colors hover:bg-surface focus-ring disabled:opacity-50"
        >
          <Volume2 size={18} className="text-primary-text" aria-hidden />
          Repetir
          <kbd className="hidden rounded-md border border-border-subtle px-1.5 font-mono text-caption text-fg-muted sm:inline">
            R
          </kbd>
        </button>
      </div>

      <div className={cn('grid flex-1 divide-x divide-border-subtle', LANE_COLS[laneCount] ?? 'grid-cols-2')}>
        {Array.from({ length: laneCount }).map((_, laneIdx) => {
          const ship = ships.find((s) => s.lane === laneIdx)
          return (
            <div key={laneIdx} className="relative flex flex-col justify-end">
              {ship && (
                <button
                  type="button"
                  onClick={() => onShoot(ship.id)}
                  disabled={paused}
                  aria-label={`Disparar a ${ship.word}, carril ${laneIdx + 1}`}
                  style={{ top: shipTop(ship.y) }}
                  className="absolute left-1/2 flex w-11/12 max-w-40 -translate-x-1/2 flex-col items-center gap-0.5 rounded-2xl border-2 border-border-strong bg-surface-raised px-2 py-3 shadow-sm text-center transition-colors hover:border-primary focus-ring active:scale-95"
                >
                  <span className="font-heading text-h4 font-extrabold text-fg">{ship.word}</span>
                  <span className="font-ipa text-body-sm text-fg-muted">{ship.ipa}</span>
                </button>
              )}
              <div className="flex justify-center border-t-2 border-dashed border-border-default py-2">
                <kbd className="grid size-7 place-items-center rounded-md border border-border-subtle bg-surface-raised font-mono text-caption font-bold text-fg-muted">
                  {laneIdx + 1}
                </kbd>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
