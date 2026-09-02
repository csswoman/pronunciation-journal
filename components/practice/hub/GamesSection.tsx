// Planned structure:
// <GamesSection>
//   <PracticeCategoryLane title kicker description>
//     compact single card listing upcoming games ("Juegos de vocabulario — En camino")
//   </PracticeCategoryLane>
// </GamesSection>

// Planned structure:
// <GamesSection> — "Juegos de vocabulario" bento card (Próximamente badge, game tags, controller graphic)

export default function GamesSection() {
  return (
    <div className="group relative flex flex-col justify-between gap-6 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-colors hover:border-border-strong h-full overflow-hidden opacity-90">
      <div className="flex flex-col gap-3 min-w-0 z-10">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 font-bold text-fg">Juegos de vocabulario</h2>
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-0.5 font-caption text-tiny font-medium text-fg-muted">
            Próximamente
          </span>
        </div>

        <p className="text-body-sm text-fg-muted text-pretty max-w-prose">
          Mecánicas ágiles para acelerar la velocidad de reconocimiento.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 z-10">
        {['Word Chain', 'Chunk Duel', 'Phoneme Invaders', 'Lluvia de palabras'].map((gameTitle) => (
          <span
            key={gameTitle}
            className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken/80 px-2.5 py-1 font-mono text-tiny text-fg-subtle"
          >
            {gameTitle}
          </span>
        ))}
      </div>

      {/* Game controller graphic illustration (bottom right) */}
      <div className="absolute right-4 bottom-4 hidden sm:flex h-20 w-32 flex-col items-center justify-center rounded-xl border border-border-subtle/40 bg-surface-sunken/30 opacity-40 transition-opacity group-hover:opacity-70">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-border-strong/40" />
          <div className="flex gap-1">
            <div className="h-2 w-2 rounded-full bg-primary/40" />
            <div className="h-2 w-2 rounded-full bg-primary/40" />
          </div>
        </div>
      </div>
    </div>
  )
}


