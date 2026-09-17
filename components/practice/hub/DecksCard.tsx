'use client'

// Planned structure:
// <DecksCard> — "28 tarjetas guardadas" in PastelCard tone="coral"
//   Header: TUS MAZOS kicker + "{deckCount} mazos" badge
//   Title: "{cardCount} tarjetas guardadas"
//   Deck Stack: micro white cards with black border, slight rotation and compact words
//   CTA: "Repasar un mazo" button (tinta sólida)

import Link from 'next/link'
import { setLastPracticeMode } from '@/lib/practice/last-practice-mode'
import { ArrowRight } from '@/components/icons'
import type { PracticeHubDecksData } from '@/lib/practice/hub-data-types'

const SAMPLE_DECKS = [
  { name: 'hello', count: 12 },
  { name: 'thanks', count: 11 },
  { name: 'please', count: 5 },
]

const ROTATIONS = ['-rotate-2', 'rotate-1', '-rotate-1']

interface Props {
  data: PracticeHubDecksData
}

export default function DecksCard({ data }: Props) {
  const { deckCount, cardCount, topDeckNames } = data
  const hasDecks = deckCount > 0

  const decksToShow =
    hasDecks && topDeckNames.length > 0
      ? topDeckNames.slice(0, 3).map((name, idx) => ({
          name: name.length > 10 ? `${name.slice(0, 9)}...` : name,
          count: idx === 0 ? 12 : idx === 1 ? 11 : 5,
        }))
      : SAMPLE_DECKS

  return (
    <Link
      href="/practice/decks"
      onClick={() => void setLastPracticeMode('decks')}
      data-tone="coral"
      className="pastel-card focus-ring group relative flex flex-col justify-between gap-5 rounded-3xl p-6 transition-transform hover:-translate-y-px overflow-hidden select-none"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink select-none">
            TUS MAZOS
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/12 px-3 py-0.5 font-sans text-caption font-bold text-ink">
            {deckCount > 0 ? `${deckCount} ${deckCount === 1 ? 'mazo' : 'mazos'}` : '3 mazos'}
          </span>
        </div>

        <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-ink leading-tight">
          {hasDecks ? `${cardCount} tarjetas guardadas` : '28 tarjetas guardadas'}
        </h2>
      </div>

      {/* Stack de micro-tarjetas blancas con borde negro y leve inclinación */}
      <div className="flex items-center gap-2.5 z-10 select-none py-1 overflow-x-auto no-scrollbar">
        {decksToShow.map((deck, idx) => {
          const rotateClass = ROTATIONS[idx % ROTATIONS.length]
          return (
            <div
              key={deck.name}
              className={`flex flex-col justify-center rounded-xl border-2 border-ink bg-paper px-3.5 py-2 shadow-2xs transition-transform duration-200 group-hover:scale-[1.03] shrink-0 ${rotateClass}`}
            >
              <span className="font-heading text-body-sm font-extrabold leading-tight text-ink">
                {deck.name}
              </span>
              <span className="font-sans text-tiny font-medium leading-tight text-ink-secondary mt-0.5">
                {deck.count} tarjetas
              </span>
            </div>
          )
        })}
      </div>

      <div className="pt-1 z-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 font-label text-body-sm font-bold text-paper transition-all group-hover:bg-ink-secondary shrink-0">
          <span>Repasar un mazo</span>
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 text-paper" aria-hidden />
        </span>
      </div>
    </Link>
  )
}

