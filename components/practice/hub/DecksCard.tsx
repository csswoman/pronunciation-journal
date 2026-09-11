'use client'

// Planned structure:
// <DecksCard> — "Tus mazos" bento card
//   header: hand-drawn chip + title
//   description + real deck-name chips (or empty-state line)
//   footer: real deck / card counts
//   illustration: hand-drawn watermark, bottom-right

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/db'
import { getIllustration } from '@/lib/illustrations/registry'
import type { PracticeHubDecksData } from '@/lib/practice/hub-data-types'

const Illustration = getIllustration('domainWriting')

interface Props {
  data: PracticeHubDecksData
}

export default function DecksCard({ data }: Props) {
  const { deckCount, cardCount, topDeckNames } = data
  const hasDecks = deckCount > 0

  return (
    <Link
      href="/practice/decks"
      onClick={() => void setLastPracticeMode('decks')}
      className="group relative flex flex-col justify-between gap-5 overflow-hidden rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm active:scale-[0.99] focus-ring"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-primary [&>svg]:h-5 [&>svg]:w-auto">
            <Illustration aria-hidden />
          </span>
          <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">libre</span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg group-hover:text-primary transition-colors">
            Tus mazos
          </h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            El vocabulario que guardaste en tus listas.
          </p>
        </div>

        {hasDecks && topDeckNames.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {topDeckNames.map((deckName) => (
              <span
                key={deckName}
                className="inline-flex items-center rounded border border-border-subtle bg-surface-sunken/60 px-2 py-0.5 font-mono text-tiny text-fg-subtle"
              >
                {deckName}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between font-caption text-tiny text-fg-subtle pt-2 z-10">
        {hasDecks ? (
          <>
            <span>
              {deckCount} {deckCount === 1 ? 'mazo' : 'mazos'}
            </span>
            <span>
              {cardCount} {cardCount === 1 ? 'tarjeta' : 'tarjetas'}
            </span>
          </>
        ) : (
          <span>Aún no creas mazos · empieza uno</span>
        )}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-2 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-20 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </Link>
  )
}
