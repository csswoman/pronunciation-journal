'use client'

// Planned structure:
// <Phase3LadderCard>
//   <LadderLevel />
//   <LadderTransferAction />
// </Phase3LadderCard>

import { useState } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeActionBar, PracticeContinueButton, PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { EdDrillItem, EdEnvironment } from '@/lib/pronunciation/ed-drills/types'

interface Phase3LadderCardProps {
  item: EdDrillItem
  unlockedLevel: EdEnvironment
  onComplete: () => void
}

const LEVEL_LABELS: Record<EdEnvironment, string> = {
  1: 'Nivel 1 · Vocal',
  2: 'Nivel 2 · Pausa',
  3: 'Nivel 3 · Consonante',
}

export function Phase3LadderCard({ item, unlockedLevel, onComplete }: Phase3LadderCardProps) {
  const [activeLevel, setActiveLevel] = useState<EdEnvironment>(1)
  const activeEnvironment = item.environments[activeLevel]

  return (
    <PracticeExerciseCard spacing="roomy">
      <div className="flex w-full flex-col gap-2 text-center">
        <span className="font-kicker text-primary">Fase 3 · Escalera</span>
        <h2 className="text-h3 text-fg">Lleva el cierre a otro entorno</h2>
      </div>

      <div className="grid w-full gap-2 sm:grid-cols-3" role="tablist" aria-label="Niveles de la escalera">
        {([1, 2, 3] as const).map((level) => {
          const isLocked = level === 3 && unlockedLevel < 3
          return (
            <button
              key={level}
              type="button"
              role="tab"
              aria-selected={activeLevel === level}
              disabled={isLocked}
              onClick={() => setActiveLevel(level)}
              className={cn(
                'min-h-11 rounded-md border px-3 py-2 text-caption font-semibold transition-colors focus-ring',
                activeLevel === level ? 'border-primary bg-primary-soft text-primary' : 'border-border-subtle bg-surface-base text-fg-muted hover:bg-surface-sunken',
                isLocked && 'cursor-not-allowed opacity-50',
              )}
            >
              {LEVEL_LABELS[level]}{isLocked ? ' · Bloqueado' : ''}
            </button>
          )
        })}
      </div>

      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="text-body-lg font-medium text-fg">{activeEnvironment.sentence}</p>
        <p className="font-ipa text-body-md text-fg-muted">{activeEnvironment.ipa}</p>
        <ListenButton onPlay={() => speak(activeEnvironment.sentence)} label="Escuchar entorno" />
        {activeLevel === 3 ? (
          <p className="text-caption text-fg-muted">En este nivel basta con que el reconocimiento conserve el verbo en pasado.</p>
        ) : null}
      </div>

      <PracticeActionBar>
        <PracticeContinueButton onClick={onComplete}>Terminar escalera</PracticeContinueButton>
      </PracticeActionBar>
    </PracticeExerciseCard>
  )
}
