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
    <div className="flex w-full flex-col gap-2">
      <p className="m-0 text-2xl font-bold leading-tight text-balance text-fg">
        {title}
      </p>
      <p className="m-0 max-w-[70ch] text-base leading-snug text-pretty text-fg">
        {exercise.taskPrompt}
      </p>
      <div className="flex min-w-0 items-center gap-2 rounded-[var(--radius-md)] bg-surface-raised px-3 py-2 text-[13px]">
        <span className="shrink-0 font-semibold text-fg">{exercise.targetItem}</span>
        {exercise.targetMeaning && (
          <>
            <span className="shrink-0 text-fg-subtle" aria-hidden>·</span>
            <span className="min-w-0 truncate italic text-fg-muted">{exercise.targetMeaning}</span>
          </>
        )}
        <ListenButton
          iconOnly
          className="ml-auto h-11 w-11"
          onPlay={() => speak(exercise.targetItem)}
          aria-label="Escuchar la palabra objetivo"
        />
      </div>
    </div>
  )
}
