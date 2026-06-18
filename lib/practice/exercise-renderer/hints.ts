import type { GenericExercise } from '@/lib/exercises/types'

export type ShellHint = { word: string; meaning?: string }

export function getGenericHint(data: GenericExercise): ShellHint | undefined {
  switch (data.type) {
    case 'sentence_dictation':
      return undefined
    default:
      return undefined
  }
}
