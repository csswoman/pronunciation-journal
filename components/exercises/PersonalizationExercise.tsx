'use client'

// Planned structure:
// <PersonalizationExercise>
//   <ModeDispatcher />
// </PersonalizationExercise>

import type { ComponentType } from 'react'
import { PersonalizationFrameExercise } from './PersonalizationFrameExercise'
import { PersonalizationOpenExercise } from './PersonalizationOpenExercise'
import type { PersonalizationExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

interface Props {
  exercise: Exercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}

type FrameComponent = ComponentType<{
  exercise: Extract<Exercise, { mode: 'frame' }>
  onResult: Props['onResult']
}>

type OpenComponent = ComponentType<{
  exercise: Extract<Exercise, { mode: 'open' }>
  onResult: Props['onResult']
}>

const MODE_MAP: {
  frame: FrameComponent
  open: OpenComponent
} = {
  frame: PersonalizationFrameExercise,
  open: PersonalizationOpenExercise,
}

export function PersonalizationExercise({ exercise, onResult }: Props) {
  if (exercise.mode === 'frame') {
    const Renderer = MODE_MAP.frame
    return <Renderer exercise={exercise} onResult={onResult} />
  }
  const Renderer = MODE_MAP.open
  return <Renderer exercise={exercise} onResult={onResult} />
}
