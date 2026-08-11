'use client'

import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import type { SpokenProductionExercise, WrittenProductionExercise } from '@/lib/exercises/types'

type ProductionExercise = WrittenProductionExercise | SpokenProductionExercise

interface Props {
  exercise: ProductionExercise
  title: string
}

export function ProductionTaskHeader({ exercise, title }: Props) {
  return (
    <div className="flex w-full flex-col gap-3">
      <p className="m-0 text-h3 text-balance text-fg">
        {title}
      </p>
      <p className="m-0 max-w-[70ch] text-body-md leading-snug text-pretty text-fg">
        {exercise.taskPrompt}
      </p>
      <div className="flex min-w-0 flex-col gap-2 rounded-[var(--radius-md)] bg-surface-raised p-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <span className="min-w-0 text-h4 font-semibold text-fg">{exercise.targetItem}</span>
          <ListenButton
            iconOnly
            className="h-11 w-11"
            onPlay={() => speak(exercise.targetItem)}
            aria-label={`Escuchar ${exercise.targetItem}`}
          />
        </div>
        {exercise.targetMeaning && (
          <p className="m-0 text-body-sm leading-relaxed text-fg-muted text-pretty">
            <span className="font-medium text-fg">Significado: </span>
            {exercise.targetMeaning}
          </p>
        )}
      </div>
    </div>
  )
}
