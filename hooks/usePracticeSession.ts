'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Exercise, SessionAnswer } from '@/lib/phoneme-practice/types'

export interface SessionState {
  exercises: Exercise[]
  currentIndex: number
  answers: SessionAnswer[]
  isComplete: boolean
}

export function usePracticeSession(exercises: Exercise[]) {
  const [state, setState] = useState<SessionState>({
    exercises,
    currentIndex: 0,
    answers: [],
    isComplete: false,
  })

  useEffect(() => {
    if (exercises.length > 0) {
      setState({ exercises, currentIndex: 0, answers: [], isComplete: false })
    }
  }, [exercises])

  const currentExercise = state.exercises[state.currentIndex] ?? null

  const submitAnswer = useCallback(
    (answer: { isCorrect: boolean; userAnswer: string; startedAt: number }) => {
      if (!currentExercise) return
      const sessionAnswer: SessionAnswer = {
        soundId: currentExercise.soundId,
        exerciseType: currentExercise.type,
        isCorrect: answer.isCorrect,
        userAnswer: answer.userAnswer,
        targetWord: currentExercise.targetWord,
        timeMs: Date.now() - answer.startedAt,
        exercisePayload: {
          type: currentExercise.type,
          soundId: currentExercise.soundId,
          options: currentExercise.options,
          correctIds: currentExercise.correctIds,
          targetWord: currentExercise.targetWord,
          timestamp: Date.now(),
        },
      }
      setState(prev => ({ ...prev, answers: [...prev.answers, sessionAnswer] }))
    },
    [currentExercise]
  )

  const advance = useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentIndex + 1
      return {
        ...prev,
        currentIndex: nextIndex,
        isComplete: nextIndex >= prev.exercises.length,
      }
    })
  }, [])

  const sessionAccuracy =
    state.answers.length > 0
      ? state.answers.filter(a => a.isCorrect).length / state.answers.length
      : 0

  return {
    currentExercise,
    currentIndex: state.currentIndex,
    total: state.exercises.length,
    answers: state.answers,
    isComplete: state.isComplete,
    sessionAccuracy,
    submitAnswer,
    advance,
  }
}
