'use client'

// Planned structure:
// <GameIntroPanel>
//   <GameBackLink />
//   <PastelCard tone>
//     <IntroHeader icon kicker title description />
//     <RuleList rules />
//     {children /* optional setup controls */}
//     <StartButton label duration />
//   </PastelCard>
// </GameIntroPanel>

import type { ReactNode } from 'react'
import PastelCard from '@/components/layout/PastelCard'
import Button from '@/components/ui/Button'
import { Play } from '@/components/icons'
import GameBackLink from './GameBackLink'
import type { GameIntroCopy } from './types'

interface GameIntroPanelProps {
  copy: GameIntroCopy
  onStart: () => void
  /** Disables start when the game has no content to play. */
  unavailableReason?: string
  children?: ReactNode
}

export default function GameIntroPanel({
  copy,
  onStart,
  unavailableReason,
  children,
}: GameIntroPanelProps) {
  const Icon = copy.icon

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4 sm:py-8">
      <GameBackLink />

      <PastelCard tone={copy.tone} className="flex flex-col gap-6 p-6 text-ink sm:p-8">
        <header className="flex flex-col gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-ink text-paper" aria-hidden>
            <Icon size={24} strokeWidth={2} />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="font-sans text-caption font-semibold text-ink-secondary">{copy.kicker}</p>
            <h1 className="font-heading text-h2 font-extrabold leading-tight text-balance text-ink">
              {copy.title}
            </h1>
          </div>
          <p className="max-w-prose font-sans text-body-md text-pretty text-ink-secondary">
            {copy.description}
          </p>
        </header>

        <ul className="flex flex-col border-t border-ink/15" aria-label="Cómo se juega">
          {copy.rules.map(({ icon: RuleIcon, text }) => (
            <li
              key={text}
              className="flex items-start gap-3 border-b border-ink/15 py-3 font-sans text-body-sm text-ink"
            >
              <RuleIcon size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-ink-secondary" aria-hidden />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        {children}

        <div className="flex flex-col gap-2">
          <Button
            variant="ej-ink"
            size="lg"
            fullWidth
            onClick={onStart}
            disabled={Boolean(unavailableReason)}
            icon={<Play size={18} aria-hidden />}
          >
            {copy.startLabel} · {copy.duration}
          </Button>
          {unavailableReason && (
            <p className="text-center font-sans text-caption text-ink-secondary" role="status">
              {unavailableReason}
            </p>
          )}
        </div>
      </PastelCard>
    </div>
  )
}
