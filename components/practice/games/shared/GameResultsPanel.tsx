'use client'

// Planned structure:
// <GameResultsPanel>
//   <GameBackLink />
//   <PastelCard tone>
//     <ResultsHeader headline summary />
//     <StatRow stats />
//     {children /* game-specific review list */}
//     <ResultsActions onRestart />
//   </PastelCard>
// </GameResultsPanel>

import type { ReactNode } from 'react'
import Link from 'next/link'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import Button from '@/components/ui/Button'
import { RotateCcw } from '@/components/icons'
import GameBackLink from './GameBackLink'
import type { GameStat } from './types'

interface GameResultsPanelProps {
  tone: PastelTone
  headline: string
  summary: string
  stats: GameStat[]
  onRestart: () => void
  children?: ReactNode
}

export default function GameResultsPanel({
  tone,
  headline,
  summary,
  stats,
  onRestart,
  children,
}: GameResultsPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4 sm:py-8">
      <GameBackLink />

      <PastelCard
        tone={tone}
        className="flex flex-col gap-6 p-6 text-ink animate-state-in sm:p-8"
        aria-labelledby="game-results-title"
      >
        <header className="flex flex-col gap-1.5">
          <p className="font-sans text-caption font-semibold text-ink-secondary">Partida terminada</p>
          <h2 id="game-results-title" className="font-heading text-h2 font-extrabold leading-tight text-balance text-ink">
            {headline}
          </h2>
          <p className="max-w-prose font-sans text-body-md text-pretty text-ink-secondary">{summary}</p>
        </header>

        <dl className="grid grid-cols-3 divide-x divide-ink/15 border-y border-ink/15">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col gap-0.5 px-3 py-3 first:pl-0">
              <dt className="font-sans text-caption text-ink-secondary">{stat.label}</dt>
              <dd className="font-heading text-h3 font-extrabold tabular-nums text-ink">{stat.value}</dd>
            </div>
          ))}
        </dl>

        {children}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ej-ink"
            size="md"
            className="sm:flex-1"
            fullWidth
            onClick={onRestart}
            icon={<RotateCcw size={18} aria-hidden />}
            autoFocus
          >
            Jugar otra vez
          </Button>
          <Link
            href="/practice/games"
            className="inline-flex h-11 items-center justify-center rounded-full border-2 border-ink px-5 font-sans text-body-md font-bold text-ink transition-colors hover:bg-ink/5 focus-ring sm:flex-1"
          >
            Volver a juegos
          </Link>
        </div>
      </PastelCard>
    </div>
  )
}
