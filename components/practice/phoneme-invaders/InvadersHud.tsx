'use client'

// Planned structure:
// <InvadersHud>
//   <LeftMetrics>
//     <ScoreChip />
//     <WaveChip />
//     <StreakChip />
//   </LeftMetrics>
//   <RightControls>
//     <RepeatAudioButton />
//     <ShieldsDisplay />
//   </RightControls>
// </InvadersHud>

import { Volume2, Heart } from '@/components/icons'

interface InvadersHudProps {
  score: number
  wave: number
  streak: number
  shields: number
  onRepeatAudio: () => void
}

export default function InvadersHud({
  score,
  wave,
  streak,
  shields,
  onRepeatAudio,
}: InvadersHudProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-surface-card border border-border/40 text-fg shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
            PUNTOS
          </span>
          <span className="font-heading text-xl font-extrabold text-fg">
            {score}
          </span>
        </div>

        <div className="h-8 w-px bg-border/40" />

        <div className="flex flex-col">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
            OLEADA
          </span>
          <span className="font-sans text-lg font-bold text-fg">
            #{wave}
          </span>
        </div>

        {streak >= 3 && (
          <div className="flex items-center gap-1 rounded-full bg-accent-amber/10 px-2.5 py-0.5 font-mono text-caption font-bold text-accent-amber">
            🔥 {streak}×
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onRepeatAudio}
          className="inline-flex items-center gap-1.5 rounded-full bg-surface-base border border-border px-3 py-1.5 font-sans text-caption font-bold text-fg hover:bg-surface-elevated transition-colors"
          title="Escuchar palabra objetivo otra vez"
        >
          <Volume2 size={16} className="text-primary" />
          <span>Repetir</span>
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              size={20}
              className={i < shields ? 'fill-accent-rose text-accent-rose' : 'text-fg-muted/30'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
