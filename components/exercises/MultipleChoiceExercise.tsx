'use client'

// Planned structure:
// <MultipleChoiceExercise>
//   <QuestionPrompt />
//   <MultipleChoiceBase (indicatorType="radio") />
//   <FeedbackBar />
// </MultipleChoiceExercise>

import { useState, useRef, useEffect } from 'react'
import type { MultipleChoiceExercise as MultipleChoiceExerciseType } from '@/lib/exercises/types'
import { buildPedagogicalFeedback } from '@/lib/exercises/feedback'
import { useUISounds } from '@/hooks/useUISounds'
import { MultipleChoiceBase } from '@/components/exercises/MultipleChoiceBase'
import { ListenButton } from '@/components/ui/ListenButton'
import { speak } from '@/lib/phoneme-practice/tts'

interface Props {
  exercise: MultipleChoiceExerciseType
  onResult: (isCorrect: boolean, userAnswer: string, timeMs: number, extras?: { feedback?: ReturnType<typeof buildPedagogicalFeedback> }) => void
  hintCount?: number
}

type AnswerState = 'idle' | 'correct' | 'wrong'

export function MultipleChoiceExercise({ exercise, onResult, hintCount = 0 }: Props) {
  const [selected, setSelected] = useState<number | null>(null)
  const [state, setState] = useState<AnswerState>('idle')
  const startMs = useRef(Date.now())
  const { playTap, playCorrect, playWrong } = useUISounds()

  useEffect(() => {
    setSelected(null)
    setState('idle')
    startMs.current = Date.now()
  }, [exercise.id])

  function handleSelect(_opt: { id: string | number; label: string }, idx: number) {
    if (state !== 'idle') return
    playTap()
    const isCorrect = idx === exercise.answerIndex
    setSelected(idx)
    setState(isCorrect ? 'correct' : 'wrong')
    if (isCorrect) playCorrect(); else playWrong()
    const userAnswer = exercise.options[idx]
    onResult(isCorrect, userAnswer, Date.now() - startMs.current, {
      feedback: buildPedagogicalFeedback(exercise, isCorrect, userAnswer, { hintUsed: hintCount > 0 }),
    })
  }

  const options = exercise.options.map((opt, idx) => ({ id: idx, label: opt }))

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-2 rounded-3xl bg-sky px-8 py-6 text-ink">
        <span className="text-tiny font-semibold uppercase tracking-widest text-ink/70">
          Pregunta
        </span>
        <p className="m-0 font-display text-h3 font-bold leading-snug text-ink! sm:text-h2">
          {exercise.question}
        </p>
      </div>

      {exercise.audioText ? (
        <ListenButton
          onPlay={() => speak(exercise.audioText!)}
          label="Escuchar el modelo"
          aria-label="Escuchar el chunk antes de responder"
        />
      ) : null}

      <MultipleChoiceBase
        options={options}
        selectedId={selected}
        correctId={exercise.answerIndex}
        state={state}
        onSelect={handleSelect}
        indicatorType="number"
      />

      {(state === 'wrong' || (state === 'idle' && hintCount > 0)) && exercise.explanation && (
        <p className="text-body-sm px-4 py-3 rounded-2xl bg-surface-sunken border border-border-subtle text-fg-muted">
          {exercise.explanation}
        </p>
      )}
    </div>
  )
}
