'use client'

// Planned structure:
// <WordSearchSourceTabs>
//   <TabsHeader title="3 · DE DÓNDE SALEN LAS PALABRAS" />
//   <TabsGrid>
//     <SourceCard option="essential" label="Esenciales" icon={GraduationCap} />
//     <SourceCard option="dictionary" label="Diccionario" icon={BookOpen} />
//     <SourceCard option="word_bank" label="Mis mazos" icon={Layers} />
//     <SourceCard option="curated" label="Por sonido" icon={Volume2} />
//     <SourceCard option="gemini" label="Con IA" icon={Sparkles} />
//   </TabsGrid>
// </WordSearchSourceTabs>

import type { KeyboardEvent } from 'react'
import type { WordSearchSource } from '@/lib/exercises/word-search/types'
import { BookOpen, GraduationCap, Layers, Sparkles, Volume2 } from '@/components/icons'

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
  { id: 'essential', label: 'Esenciales', icon: GraduationCap },
  { id: 'dictionary', label: 'Diccionario', icon: BookOpen },
  { id: 'word_bank', label: 'Mis mazos', icon: Layers },
  { id: 'curated', label: 'Por sonido', icon: Volume2 },
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
    <div className="flex flex-col gap-2.5">
      <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
        3 · DE DÓNDE SALEN LAS PALABRAS
      </span>

      <div
        role="tablist"
        aria-label="Origen del vocabulario para la sopa de letras"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
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
              className={`focus-ring flex flex-col items-start gap-2 rounded-2xl p-3.5 text-left transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                isSelected
                  ? 'border-2 border-[#12151c] bg-[#b9d3fb] text-[#12151c] shadow-xs'
                  : 'border-2 border-border-default bg-surface hover:border-border-strong text-fg'
              }`}
            >
              <span
                className={`flex h-8.5 w-8.5 items-center justify-center rounded-xl transition-colors ${
                  isSelected ? 'bg-black/12 text-[#12151c]' : 'bg-surface-sunken text-fg'
                }`}
              >
                <Icon size={17} aria-hidden />
              </span>
              <span className="font-heading text-body-sm font-bold leading-snug">
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
