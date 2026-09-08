'use client'

// Planned structure:
// <WordSearchSourceTabs>
//   <TabListContainer />   (role="tablist" con estilo segmented control)
//     <TabItem />          (Diccionario, Mis palabras, Fonética, Con IA)
// </WordSearchSourceTabs>

import type { KeyboardEvent } from 'react'
import type { WordSearchSource } from '@/lib/exercises/word-search/types'
import { BookOpen, Layers, Sparkles, Volume2 } from '@/components/icons'

interface Props {
  activeSource: WordSearchSource
  onSelect: (source: WordSearchSource) => void
  myWordsCount: number
}

const SOURCES: Array<{
  id: WordSearchSource
  label: string
  icon: typeof BookOpen
}> = [
  { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
  { id: 'word_bank', label: 'Mis palabras', icon: Layers },
  { id: 'curated', label: 'Fonética', icon: Volume2 },
  { id: 'gemini', label: 'Con IA', icon: Sparkles },
]

export default function WordSearchSourceTabs({
  activeSource,
  onSelect,
  myWordsCount,
}: Props) {
  const handleKeyDown = (
    currentSource: WordSearchSource,
    event: KeyboardEvent<HTMLButtonElement>,
  ) => {
    const ids = SOURCES.map((s) => s.id)
    const currentIndex = ids.indexOf(currentSource)
    let nextSource: WordSearchSource | undefined

    if (event.key === 'ArrowRight') {
      nextSource = ids[(currentIndex + 1) % ids.length]
    } else if (event.key === 'ArrowLeft') {
      nextSource = ids[(currentIndex - 1 + ids.length) % ids.length]
    } else if (event.key === 'Home') {
      nextSource = ids[0]
    } else if (event.key === 'End') {
      nextSource = ids[ids.length - 1]
    }

    if (!nextSource) return
    event.preventDefault()
    onSelect(nextSource)
    window.requestAnimationFrame(() => {
      document.getElementById(`word-search-tab-${nextSource}`)?.focus()
    })
  }

  return (
    <div
      role="tablist"
      aria-label="Origen del vocabulario para la sopa de letras"
      className="grid grid-cols-2 gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-1 shadow-xs sm:grid-cols-4"
    >
      {SOURCES.map(({ id, label, icon: Icon }) => {
        const isSelected = activeSource === id
        const ariaLabel =
          id === 'word_bank' ? `${label}, ${myWordsCount} palabras disponibles` : label

        return (
          <button
            key={id}
            type="button"
            id={`word-search-tab-${id}`}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`word-search-panel-${id}`}
            aria-label={ariaLabel}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(id)}
            onKeyDown={(e) => handleKeyDown(id, e)}
            className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2.5 py-2 text-caption font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none sm:px-3 sm:text-body-sm ${
              isSelected
                ? 'border border-border-subtle/80 bg-surface-raised text-fg shadow-xs'
                : 'text-fg-muted hover:bg-surface-raised/40 hover:text-fg'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
