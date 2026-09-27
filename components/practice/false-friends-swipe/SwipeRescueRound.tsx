'use client'

// Planned structure:
// <SwipeRescueRound>
//   <HeaderTitle font-heading />
//   <SentencePrompt sentence />
//   <OptionsGrid options onSelect />
// </SwipeRescueRound>

import type { SwipeMissRecord } from '@/lib/games/false-friends-swipe/engine'

interface SwipeRescueRoundProps {
  miss: SwipeMissRecord
  rescueIndex: number
  totalRescues: number
  onAnswerRescue: (choiceIndex: number) => void
}

export default function SwipeRescueRound({
  miss,
  rescueIndex,
  totalRescues,
  onAnswerRescue,
}: SwipeRescueRoundProps) {
  const prompt = miss.card.prompt

  return (
    <div className="w-full max-w-md mx-auto space-y-4 p-6 rounded-3xl bg-surface-card border-2 border-accent-amber/40 shadow-lg text-center">
      <span className="font-mono text-tiny font-bold uppercase tracking-wider text-accent-amber">
        RONDA DE RESCATE ({rescueIndex + 1} DE {totalRescues})
      </span>

      <h3 className="font-heading text-xl font-extrabold text-fg">
        ¡Demuestra que ya no caes en la trampa!
      </h3>

      <div className="p-4 rounded-2xl bg-surface-base border border-border/50 font-sans text-body font-bold text-fg">
        «{prompt.sentence}»
      </div>

      <div className="grid grid-cols-1 gap-2 pt-2">
        {prompt.options.map((opt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onAnswerRescue(idx)}
            className="py-3 px-4 rounded-2xl bg-surface-base border border-border hover:border-primary text-fg font-sans text-body-sm font-bold hover:bg-surface-elevated transition-colors cursor-pointer text-center"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}
