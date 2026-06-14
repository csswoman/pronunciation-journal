import type { GenericExercise } from '@/lib/exercises/types'

export type ShellHint = { word: string; meaning?: string }

export function getGenericHint(data: GenericExercise): ShellHint | undefined {
  switch (data.type) {
    case 'sentence_dictation':
      if (data.targetWord) {
        return { word: data.targetWord, meaning: data.targetMeaning }
      }
      return undefined
    case 'fill_blank':
      if (data.hint) return { word: data.hint }
      return undefined
    default:
      return undefined
  }
}
