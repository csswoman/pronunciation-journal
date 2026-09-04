'use client'

// Planned structure:
// <GamesSection> — "Juegos de vocabulario" bento card
//   Header (kicker "lúdico", title "Juegos de vocabulario", available count badge)
//   ActiveGameCard (Link to /practice/word-search with icon, description, CTA)
//   UpcomingGames (horizontal tags for upcoming games: Word Chain, Chunk Duel, etc.)
// </GamesSection>

import Link from 'next/link'
import { ArrowRight, Grid2x2 } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'

export default function GamesSection() {
  return (
    <div className="flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 md:p-6 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm h-full">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">
              lúdico
            </span>
            <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 font-caption text-tiny font-medium text-primary">
              1 disponible
            </span>
          </div>
          <h2 className="text-h3 font-bold text-fg">Juegos de vocabulario</h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Mecánicas ágiles para acelerar la velocidad de reconocimiento y retención.
          </p>
        </div>

        {/* Juego Activo: Sopa de letras */}
        <Link
          href="/practice/word-search"
          onClick={() => void setLastPracticeMode('word-search')}
          className="group/game flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-xl border border-border-subtle bg-surface-sunken/60 p-3.5 md:p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-sunken active:scale-[0.99] focus-ring"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-primary shadow-2xs group-hover/game:border-primary/30 transition-colors">
              <Grid2x2 size={20} aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-body-sm font-semibold text-fg group-hover/game:text-primary transition-colors">
                  Sopa de letras
                </span>
                <span className="font-mono text-tiny text-fg-subtle hidden xs:inline">
                  (Word Search)
                </span>
              </div>
              <p className="text-body-xs text-fg-muted">
                Encuentra palabras con pistas ortográficas, fonemas y audio nativo.
              </p>
            </div>
          </div>

          <div className="flex items-center self-end sm:self-center shrink-0">
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
      </div>

      {/* Próximos juegos */}
      <div className="flex flex-col gap-2 pt-1 border-t border-border-subtle/60">
        <div className="flex items-center justify-between gap-2">
          <span className="font-caption text-tiny text-fg-subtle">
            En desarrollo
          </span>
          <span className="font-caption text-tiny text-fg-subtle">
            Próximamente
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {['Word Chain', 'Chunk Duel', 'Phoneme Invaders', 'Lluvia de palabras'].map(
            (gameTitle) => (
              <span
                key={gameTitle}
                className="inline-flex items-center rounded-md border border-border-subtle bg-surface-sunken/40 px-2 py-0.5 font-mono text-tiny text-fg-subtle opacity-75"
              >
                {gameTitle}
              </span>
            ),
          )}
        </div>
      </div>
    </div>
  )
}


