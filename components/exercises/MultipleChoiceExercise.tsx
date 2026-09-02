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
      <p className="text-body-lg font-medium text-fg leading-snug">
        {exercise.question}
      </p>

      <MultipleChoiceBase
        options={options}
        selectedId={selected}
        correctId={exercise.answerIndex}
        state={state}
        onSelect={handleSelect}
        indicatorType="radio"
      />

      {(state === 'wrong' || (state === 'idle' && hintCount > 0)) && exercise.explanation && (
        <p className="text-body-sm px-4 py-3 rounded-xl bg-primary-soft text-fg-muted">
          {exercise.explanation}
        </p>
      )}
    </div>
  )
}
