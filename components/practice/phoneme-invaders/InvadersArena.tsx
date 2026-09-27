'use client'

// Planned structure:
// <InvadersArena>
//   <LanesContainer cols={lanes}>
//     <LaneColumn key={lane}>
//       <ShipCard ship={ship} onShoot={onShoot} />
//     </LaneColumn>
//   </LanesContainer>
// </InvadersArena>

import { useEffect } from 'react'
import type { InvaderShip } from '@/lib/games/phoneme-invaders/engine'

interface InvadersArenaProps {
  ships: InvaderShip[]
  laneCount: number
  onShoot: (shipId: string) => void
}

export default function InvadersArena({
  ships,
  laneCount,
  onShoot,
}: InvadersArenaProps) {
  // Keyboard listener for keys 1, 2, 3, 4 corresponding to lanes
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyNum = parseInt(e.key, 10)
      if (keyNum >= 1 && keyNum <= laneCount) {
        const laneIndex = keyNum - 1
        const shipInLane = ships.find((s) => s.lane === laneIndex)
        if (shipInLane) {
          onShoot(shipInLane.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ships, laneCount, onShoot])

  return (
    <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl bg-surface-base border border-border/60 overflow-hidden shadow-inner flex flex-col justify-between p-4">
      {/* Lanes Grid background */}
      <div
        className="absolute inset-0 grid divide-x divide-border/20 pointer-events-none"
        style={{ gridTemplateColumns: `repeat(${laneCount}, 1fr)` }}
      >
        {Array.from({ length: laneCount }).map((_, i) => (
          <div key={i} className="relative h-full flex flex-col justify-end pb-3 items-center">
            <span className="font-mono text-tiny font-bold text-fg-muted/40 bg-surface-card/60 px-2 py-0.5 rounded-full border border-border/20">
              [{i + 1}]
            </span>
          </div>
        ))}
      </div>

      {/* Ships */}
      <div
        className="relative w-full h-full grid"
        style={{ gridTemplateColumns: `repeat(${laneCount}, 1fr)` }}
      >
        {Array.from({ length: laneCount }).map((_, laneIdx) => {
          const ship = ships.find((s) => s.lane === laneIdx)
          return (
            <div key={laneIdx} className="relative w-full h-full">
              {ship && (
                <button
                  type="button"
                  onClick={() => onShoot(ship.id)}
                  style={{ top: `${Math.min(85, ship.y)}%` }}
                  className="absolute left-1/2 -translate-x-1/2 w-[85%] max-w-[140px] p-3 rounded-2xl bg-surface-card border-2 border-primary/40 hover:border-primary shadow-md hover:scale-105 active:scale-95 transition-all text-center group cursor-pointer"
                >
                  <div className="font-mono text-tiny font-bold text-primary tracking-wider uppercase mb-0.5">
                    {ship.ipa}
                  </div>
                  <div className="font-heading text-lg font-extrabold text-fg group-hover:text-primary transition-colors">
                    {ship.word}
                  </div>
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
