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
      <p className="m-0 font-[Fraunces,Georgia,serif] text-2xl font-bold leading-tight text-fg">
        {title}
      </p>
      <p className="m-0 text-base leading-relaxed text-fg">{exercise.taskPrompt}</p>
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-surface-raised px-3 py-2 text-[13px]">
        <span className="font-semibold text-fg">{exercise.targetItem}</span>
        {exercise.targetMeaning && (
          <>
            <span className="text-fg-subtle">·</span>
            <span className="italic text-fg-muted">{exercise.targetMeaning}</span>
          </>
        )}
        <ListenButton
          iconOnly
          onPlay={() => speak(exercise.targetItem)}
          aria-label="Listen to target word"
        />
      </div>
    </div>
  )
}
