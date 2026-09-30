'use client'

// Planned structure:
// <WordSearchSaveWordsButton>
//   <SaveButton />      (guarda todas las palabras del tablero en el cuaderno)
//   <StatusMessage />   (guardadas / ya estaban / error)
// </WordSearchSaveWordsButton>

import { useState } from 'react'
import type { WordSearchItem } from '@/lib/exercises/word-search/types'
import { DuplicateWordError, quickAddWord } from '@/lib/word-bank/queries'
import Button from '@/components/ui/Button'
import { BookmarkPlus, Check } from '@/components/icons'

interface Props {
  items: WordSearchItem[]
  puzzleTitle: string
  className?: string
}

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'done'; saved: number; existing: number; failed: number }

function summarize(state: Extract<SaveState, { status: 'done' }>): string {
  const parts: string[] = []
  if (state.saved > 0) parts.push(`${state.saved} guardadas`)
  if (state.existing > 0) parts.push(`${state.existing} ya estaban`)
  if (state.failed > 0) parts.push(`${state.failed} error`)
  return parts.join(' · ')
}

export default function WordSearchSaveWordsButton({ items, puzzleTitle, className }: Props) {
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  const handleSave = async () => {
    setState({ status: 'saving' })
    let saved = 0
    let existing = 0
    let failed = 0
    for (const item of items) {
      try {
        await quickAddWord({
          text: item.displayWord.toLowerCase(),
          context: item.exampleSentence ?? `Sopa de letras: ${puzzleTitle}`,
          source: 'manual',
        })
        saved += 1
      } catch (error) {
        if (error instanceof DuplicateWordError) existing += 1
        else failed += 1
      }
    }
    setState({ status: 'done', saved, existing, failed })
  }

  if (state.status === 'done') {
    return (
      <span role="status" className="inline-flex items-center gap-1.5 text-caption font-bold text-amber-900 dark:text-amber-200">
        <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <span>{summarize(state)}</span>
      </span>
    )
  }

  return (
    <Button
      variant="primary"
      onClick={() => void handleSave()}
      isLoading={state.status === 'saving'}
      className={
        className ??
        'bg-text text-surface hover:bg-black dark:bg-amber-400 dark:text-amber-950 font-bold px-4 py-2.5 rounded-full flex items-center gap-2 text-caption shrink-0'
      }
    >
      <BookmarkPlus className="h-4 w-4" aria-hidden />
      <span>Guardar las {items.length}</span>
    </Button>
  )
}
