'use client'

import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import type { SpokenProductionExercise, WrittenProductionExercise } from '@/lib/exercises/types'

type ProductionExercise = WrittenProductionExercise | SpokenProductionExercise

interface Props {
  exercise: ProductionExercise
  title: string
}

// Planned structure:
// <ProductionTaskHeader>
//   <ConstraintBadge /> (optional)
//   <TaskTitle />
//   <TaskPrompt />
//   <TargetItemCard>
//     <WordRow>
//       <TargetWord />
//       <ListenButton />
//     </WordRow>
//     <Meaning />
//   </TargetItemCard>
// </ProductionTaskHeader>

export function ProductionTaskHeader({ exercise, title }: Props) {
  return (
    <div className="flex w-full flex-col gap-3">
      {exercise.constraint && (
        <span className="badge-accent self-start">{exercise.constraint.label}</span>
      )}
      <h2 className="m-0 text-h3 font-bold text-balance text-fg leading-tight sm:text-h2">
        {title}
      </h2>
      <p className="m-0 max-w-[65ch] text-body-sm sm:text-body-md leading-relaxed text-pretty text-fg-muted">
        {exercise.taskPrompt}
      </p>
      <div className="flex min-w-0 flex-col gap-2.5 rounded-[var(--radius-md)] border border-border-subtle bg-surface-raised/70 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="min-w-0 text-h3 sm:text-h2 font-bold text-fg tracking-tight">
            {exercise.targetItem}
          </span>
          <ListenButton
            iconOnly
            onPlay={() => speak(exercise.targetItem)}
            aria-label={`Escuchar ${exercise.targetItem}`}
          />
        </div>
        {exercise.targetMeaning && (
          <p className="m-0 text-body-sm leading-relaxed text-fg-muted text-pretty">
            <span className="font-medium text-fg-secondary">Significado: </span>
            <span className="italic">{exercise.targetMeaning}</span>
          </p>
        )}
      </div>
    </div>
  )
}
