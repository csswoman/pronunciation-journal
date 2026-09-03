'use client'

// Planned structure:
// <DecksCard> — "Tus mazos" bento card (layers icon, stats 4 active decks / 112 cards)

import Link from 'next/link'
import { Layers } from '@/components/icons'
import { setLastPracticeMode } from '@/lib/db'

export default function DecksCard() {
  return (
    <Link
      href="/practice/decks"
      onClick={() => void setLastPracticeMode('decks')}
      className="group flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong focus-ring h-full"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-primary">
            <Layers size={18} aria-hidden />
          </span>
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Tus mazos
          </h2>
        </div>

        <p className="text-body-sm text-fg-muted text-pretty">
          El vocabulario que guardaste en tus listas.
        </p>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {['Viajes', 'Trabajo', 'Verbos'].map((deckName) => (
            <span
              key={deckName}
              className="inline-flex items-center rounded border border-border-subtle bg-surface-sunken/60 px-2 py-0.5 font-mono text-tiny text-fg-subtle"
            >
              {deckName}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle pt-2">
        <span>4 mazos activos</span>
        <span>112 tarjetas</span>
      </div>
    </Link>
  )
}

