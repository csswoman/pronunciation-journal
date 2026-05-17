'use client'

// Planned structure:
// <GenericExerciseSession>
//   <SessionHeader (progress bar + type label) />
//   <ExerciseCard (wrapper with feedback) />
//     <FillBlankExercise | SentenceDictationExercise | MatchPairsExercise | ReorderWordsExercise />
//   <SessionSummary (shown on completion) />

import { useState } from 'react'
import { ExerciseCard } from '@/components/phoneme-practice/ExerciseCard'
import { FillBlankExercise } from './FillBlankExercise'
import { SentenceDictationExercise } from './SentenceDictationExercise'
import { MatchPairsExercise } from './MatchPairsExercise'
import { ReorderWordsExercise } from './ReorderWordsExercise'
import type { GenericExercise, GenericSessionAnswer } from '@/lib/exercises/types'

interface Props {
  exercises: GenericExercise[]
  onComplete?: (answers: GenericSessionAnswer[]) => void
}

const TYPE_LABEL: Record<string, string> = {
  fill_blank: 'Fill in the blank',
  sentence_dictation: 'Dictation',
  match_pairs: 'Match pairs',
  reorder_words: 'Reorder words',
}

export function GenericExerciseSession({ exercises, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<GenericSessionAnswer[]>([])
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message?: string } | null>(null)
  const [startTime, setStartTime] = useState(() => Date.now())

  const current = exercises[index]
  const isLast = index === exercises.length - 1
  const isDone = index >= exercises.length

  function handleSubmit(isCorrect: boolean, userAnswer: string) {
    const timeMs = Date.now() - startTime
    const answer: GenericSessionAnswer = {
      exerciseId: current.id,
      exerciseType: current.type,
      sourceRef: current.sourceRef,
      isCorrect,
      userAnswer,
      timeMs,
    }
    setAnswers(prev => [...prev, answer])
    setFeedback({ isCorrect })
  }

  function handleNext() {
    setFeedback(null)
    setStartTime(Date.now())
    if (isLast) {
      setIndex(exercises.length) // mark done
      onComplete?.([...answers])
    } else {
      setIndex(i => i + 1)
    }
  }

  if (isDone) {
    const correct = answers.filter(a => a.isCorrect).length
    const pct = Math.round((correct / answers.length) * 100)
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="text-5xl">{pct >= 70 ? '🎉' : '📚'}</div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)] m-0">
          Session complete!
        </h2>
        <p className="text-[var(--text-secondary)] m-0">
          {correct} / {answers.length} correct — {pct}%
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[560px] mx-auto px-4 py-6">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-[12px] text-[var(--text-tertiary)]">
          <span>{TYPE_LABEL[current.type] ?? current.type}</span>
          <span>{index + 1} / {exercises.length}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--surface-raised)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--gradient-primary)] transition-all duration-300"
            style={{ width: `${((index + 1) / exercises.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise */}
      <ExerciseCard
        exerciseType={current.type}
        feedback={feedback}
        onNext={feedback ? handleNext : undefined}
        finishLabel={isLast}
      >
        {current.type === 'fill_blank' && (
          <FillBlankExercise exercise={current} onSubmit={handleSubmit} />
        )}
        {current.type === 'sentence_dictation' && (
          <SentenceDictationExercise key={current.id} exercise={current} onSubmit={handleSubmit} />
        )}
        {current.type === 'match_pairs' && (
          <MatchPairsExercise key={current.id} exercise={current} onSubmit={handleSubmit} />
        )}
        {current.type === 'reorder_words' && (
          <ReorderWordsExercise key={current.id} exercise={current} onSubmit={handleSubmit} />
        )}
      </ExerciseCard>
    </div>
  )
}
