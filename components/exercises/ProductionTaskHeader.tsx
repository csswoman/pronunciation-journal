'use client'

import type { ReactNode } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import { formatPartOfSpeech } from '@/lib/word-of-day/format-pos'
import { stripIPASlashes as stripSlashes } from '@/lib/ai-practice/modes/pronunciation'
import type { SpeechConstraintId } from '@/lib/exercises/speech-constraints'
import type { SpokenProductionExercise, WrittenProductionExercise } from '@/lib/exercises/types'

type ProductionExercise = WrittenProductionExercise | SpokenProductionExercise

interface Props {
  exercise: ProductionExercise
  title: string
  /** Optional control shown at the right of the title (e.g. hint toggle). */
  action?: ReactNode
  /** Target card fill: coral for written, mint for spoken. */
  tone?: 'coral' | 'mint'
}

/** Tenses the learner may pick from, shown as chips on the target card. */
const TENSE_CHIPS: Partial<Record<SpeechConstraintId, readonly string[]>> = {
  spoken_verb_transform: ['Pasado', 'Pasado continuo', 'Futuro'],
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

export function ProductionTaskHeader({ exercise, title, action, tone = 'coral' }: Props) {
  // Rodeo (circumlocution) only works if the target word stays hidden — showing
  // it big and bold, plus a "listen to it" button, would hand the learner the
  // exact word they're supposed to describe around.
  const hideTargetWord = exercise.constraint?.id === 'rodeo_circumlocution'
  const posLabel = formatPartOfSpeech(exercise.targetPos)
  const tenseChips = exercise.constraint ? TENSE_CHIPS[exercise.constraint.id] : undefined

  return (
    <div className="flex w-full flex-col gap-3">
      {exercise.constraint && (
        <span className="w-fit rounded-full bg-primary px-3.5 py-1.5 font-mono text-tiny font-bold uppercase tracking-wider text-on-accent">
          {exercise.constraint.label}
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <h2 className="m-0 font-display text-h3 font-bold text-balance text-fg leading-tight sm:text-h2">
          {title}
        </h2>
        {action}
      </div>
      {!hideTargetWord && (
        <p className="m-0 max-w-[65ch] text-body-sm sm:text-body-md leading-relaxed text-pretty text-fg-muted">
          <BoldTarget prompt={exercise.taskPrompt} target={exercise.targetItem} />
        </p>
      )}
      {hideTargetWord ? (
        // El estudiante ve la palabra para poder describirla, pero sin botón de
        // audio: oírla no le ayuda y la meta es rodearla sin decirla.
        <div className="flex min-w-0 flex-col gap-1.5 rounded-3xl bg-mint px-7 py-5 text-ink">
          <span className="text-caption font-bold uppercase tracking-[0.18em] text-ink/80">
            Palabra secreta · no la digas
          </span>
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className="min-w-0 font-display text-h2 font-bold tracking-tight">
              {exercise.targetItem}
            </span>
            {exercise.targetMeaning && (
              <span className="rounded-full bg-ink/10 px-3.5 py-1 text-body-sm font-medium text-ink">
                {exercise.targetMeaning}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex min-w-0 flex-col gap-2.5 rounded-3xl p-6 text-ink',
            tone === 'mint' ? 'bg-mint' : 'bg-coral',
          )}
        >
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
          {tenseChips && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {tenseChips.map((chip) => (
                <li
                  key={chip}
                  className="rounded-full bg-ink px-3.5 py-1 font-mono text-caption font-bold uppercase tracking-wider text-white"
                >
                  {chip}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
