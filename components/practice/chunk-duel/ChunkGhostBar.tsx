'use client'

// Planned structure:
// <ChunkGhostBar>
//   <LabelGroup roundIndex totalRounds />
//   <ProgressBar progress={ghostProgress} />
// </ChunkGhostBar>

interface ChunkGhostBarProps {
  ghostProgress: number
  roundIndex: number
  totalRounds: number
}

export default function ChunkGhostBar({
  ghostProgress,
  roundIndex,
  totalRounds,
}: ChunkGhostBarProps) {
  return (
    <div className="w-full space-y-2 p-4 rounded-2xl bg-surface-card border border-border/40 shadow-sm">
      <div className="flex items-center justify-between text-caption font-bold">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
          RONDA {roundIndex} DE {totalRounds}
        </span>
        <span className="text-accent-rose flex items-center gap-1 font-sans">
          👻 Rival fantasma ({Math.min(100, Math.round(ghostProgress))}%)
        </span>
      </div>

      <div className="relative w-full h-3 rounded-full bg-surface-base border border-border/30 overflow-hidden">
        <div
          style={{ width: `${Math.min(100, ghostProgress)}%` }}
          className="h-full bg-accent-rose transition-all duration-75"
        />
      </div>
    </div>
  )
}
