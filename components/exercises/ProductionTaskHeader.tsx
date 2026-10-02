'use client'

import type { ReactNode } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { formatPartOfSpeech } from '@/lib/word-of-day/format-pos'
import { stripIPASlashes as stripSlashes } from '@/lib/ai-practice/modes/pronunciation'
import type { SpokenProductionExercise, WrittenProductionExercise } from '@/lib/exercises/types'

type ProductionExercise = WrittenProductionExercise | SpokenProductionExercise

interface Props {
  exercise: ProductionExercise
  title: string
  /** Optional control shown at the right of the title (e.g. hint toggle). */
  action?: ReactNode
}

/** Renders the prompt with the target word in bold when it appears verbatim. */
function BoldTarget({ prompt, target }: { prompt: string; target: string }) {
  const index = prompt.toLowerCase().indexOf(target.toLowerCase())
  if (index < 0) return <>{prompt}</>
  return (
    <>
      {prompt.slice(0, index)}
      <strong className="font-bold text-fg">{prompt.slice(index, index + target.length)}</strong>
      {prompt.slice(index + target.length)}
    </>
  )
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

export function ProductionTaskHeader({ exercise, title, action }: Props) {
  // Rodeo (circumlocution) only works if the target word stays hidden — showing
  // it big and bold, plus a "listen to it" button, would hand the learner the
  // exact word they're supposed to describe around.
  const hideTargetWord = exercise.constraint?.id === 'rodeo_circumlocution'
  const posLabel = formatPartOfSpeech(exercise.targetPos)

  return (
    <div className="flex w-full flex-col gap-3">
      {exercise.constraint && (
        <span className="badge-accent self-start">{exercise.constraint.label}</span>
      )}
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 font-display text-h3 font-bold text-balance text-fg leading-tight sm:text-h2">
          {title}
        </h2>
        {action}
      </div>
      <p className="m-0 max-w-[65ch] text-body-sm sm:text-body-md leading-relaxed text-pretty text-fg-muted">
        {hideTargetWord ? exercise.taskPrompt : <BoldTarget prompt={exercise.taskPrompt} target={exercise.targetItem} />}
      </p>
      {hideTargetWord ? (
        <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-dashed border-border-subtle bg-surface-raised p-5 shadow-xs">
          <span className="text-body-sm font-medium text-fg-muted">
            Palabra secreta — no la digas
          </span>
          <span className="font-display text-h3 sm:text-h2 font-bold tracking-[0.3em] text-fg-subtle select-none">
            {'•'.repeat(exercise.targetItem.length)}
          </span>
        </div>
      ) : (
        <div className="flex min-w-0 flex-col gap-2.5 rounded-3xl bg-coral p-6 text-ink">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="min-w-0 font-display text-h3 sm:text-h2 font-bold tracking-tight">
              {exercise.targetItem}
            </span>
            <ListenButton
              iconOnly
              onPlay={() => speak(exercise.targetItem)}
              aria-label={`Escuchar ${exercise.targetItem}`}
              className="size-12 border-none bg-ink text-white hover:bg-ink/85 [&_svg]:size-5"
            />
            {posLabel && (
              <span className="rounded-full bg-ink/10 px-3 py-1 text-caption font-semibold lowercase text-ink">
                {posLabel}
              </span>
            )}
          </div>
          {exercise.targetIpa && (
            <p className="m-0 text-body-md text-ink/80">/{stripSlashes(exercise.targetIpa)}/</p>
          )}
          {exercise.targetMeaning && (
            <p className="m-0 text-body-sm leading-relaxed text-ink/80 text-pretty">
              <span className="font-medium">Significado: </span>
              <span className="italic">{exercise.targetMeaning}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
