'use client'

import { useState, useCallback, useEffect } from 'react'
import type { Exercise, SessionAnswer } from '@/lib/phoneme-practice/types'

// Fail more than 3 times → no score and no re-queue
const MAX_FAILURES = 4

interface QueueItem {
  exercise: Exercise
  id: number  // stable original index
}

export interface SessionState {
  queue: QueueItem[]
  currentQueuePos: number
  answers: SessionAnswer[]
  resolvedIds: number[]
  failCounts: Record<number, number>
  isComplete: boolean
  originalCount: number
}

function buildInitialState(exercises: Exercise[]): SessionState {
  return {
    queue: exercises.map((exercise, id) => ({ exercise, id })),
    currentQueuePos: 0,
    answers: [],
    resolvedIds: [],
    failCounts: {},
    isComplete: exercises.length === 0,
    originalCount: exercises.length,
  }
}

export function usePracticeSession(exercises: Exercise[]) {
  const [state, setState] = useState<SessionState>(() => buildInitialState(exercises))

  useEffect(() => {
    if (exercises.length > 0) {
      setState(buildInitialState(exercises))
    }
  }, [exercises])

  const currentItem = state.queue[state.currentQueuePos] ?? null
  const currentExercise = currentItem?.exercise ?? null

  const submitAnswer = useCallback(
    (answer: { isCorrect: boolean; userAnswer: string; startedAt: number }) => {
      if (!currentItem) return

      setState(prev => {
        const id = currentItem.id
        const sessionAnswer: SessionAnswer = {
          soundId: currentItem.exercise.soundId,
          exerciseType: currentItem.exercise.type,
          isCorrect: answer.isCorrect,
          userAnswer: answer.userAnswer,
          targetWord: currentItem.exercise.targetWord,
          timeMs: Date.now() - answer.startedAt,
          exercisePayload: {
            type: currentItem.exercise.type,
            soundId: currentItem.exercise.soundId,
            options: currentItem.exercise.options,
            correctIds: currentItem.exercise.correctIds,
            targetWord: currentItem.exercise.targetWord,
            timestamp: Date.now(),
          },
        }

        const newFailCounts = { ...prev.failCounts }
        const newResolvedIds = [...prev.resolvedIds]
        let newQueue = [...prev.queue]

        if (answer.isCorrect) {
          if (!newResolvedIds.includes(id)) {
            newResolvedIds.push(id)
          }
        } else {
          newFailCounts[id] = (newFailCounts[id] ?? 0) + 1
          // Re-queue 2 positions ahead if under the failure cap
          if (newFailCounts[id] < MAX_FAILURES) {
            const insertAt = Math.min(prev.currentQueuePos + 3, newQueue.length)
            newQueue = [
              ...newQueue.slice(0, insertAt),
              { exercise: currentItem.exercise, id },
              ...newQueue.slice(insertAt),
            ]
          }
        }

        return {
          ...prev,
          queue: newQueue,
          answers: [...prev.answers, sessionAnswer],
          resolvedIds: newResolvedIds,
          failCounts: newFailCounts,
        }
      })
    },
    [currentItem]
  )

  const advance = useCallback(() => {
    setState(prev => {
      const nextPos = prev.currentQueuePos + 1
      return {
        ...prev,
        currentQueuePos: nextPos,
        isComplete: nextPos >= prev.queue.length,
      }
    })
  }, [])

  const completedCount = state.resolvedIds.length

  // Only count towards score if failed fewer than MAX_FAILURES times
  const scoreableCorrect = state.resolvedIds.filter(
    id => (state.failCounts[id] ?? 0) < MAX_FAILURES
  ).length

  const sessionAccuracy =
    state.answers.length > 0
      ? state.answers.filter(a => a.isCorrect).length / state.answers.length
      : 0

  return {
    currentExercise,
    currentQueuePos: state.currentQueuePos,
    queueLength: state.queue.length,
    completedCount,
    originalTotal: state.originalCount,
    answers: state.answers,
    failCounts: state.failCounts,
    isComplete: state.isComplete,
    sessionAccuracy,
    scoreableCorrect,
    submitAnswer,
    advance,
  }
}
