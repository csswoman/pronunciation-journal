'use client'

// Planned structure:
// <WordRainPlayfield>
//   <FallingWordLayer />
//   <GroundImpactLine />
//   <TrapWarningBanner />
//   <TypingInputBar />
// </WordRainPlayfield>

import type { ChangeEventHandler, RefObject } from 'react'
import type { FallingWordItem } from '@/lib/exercises/word-rain/types'
import WordRainFallingWord from './WordRainFallingWord'

interface WordRainPlayfieldProps {
  fallingItems: FallingWordItem[]
  inputVal: string
  inputRef: RefObject<HTMLInputElement | null>
  isPaused: boolean
  trapWarning: boolean
  lastTrapWord: string
  onInputChange: ChangeEventHandler<HTMLInputElement>
}

export default function WordRainPlayfield({
  fallingItems,
  inputVal,
  inputRef,
  isPaused,
  trapWarning,
  lastTrapWord,
  onInputChange,
}: WordRainPlayfieldProps) {
  return (
    <div className="relative flex flex-col h-[480px] w-full rounded-2xl border border-border-default bg-surface-sunken/40 overflow-hidden shadow-inner">
      <div className="relative flex-1 w-full overflow-hidden">
        {fallingItems.map((item) => (
          <WordRainFallingWord key={item.id} item={item} typedText={inputVal} />
        ))}

        <div
          className="absolute left-0 right-0 top-[88%] h-px bg-error/30 border-b border-dashed border-error/40 pointer-events-none"
          aria-hidden="true"
        />

        {trapWarning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-error/95 px-3.5 py-1.5 font-caption text-xs font-bold text-on-error shadow-md animate-bounce z-20">
            ¡Cuidado! &quot;{lastTrapWord}&quot; era un distractor (-1 vida)
          </div>
        )}
      </div>

      <div className="relative z-10 flex flex-col gap-1.5 p-4 border-t border-border-subtle bg-surface-raised/95 backdrop-blur-xs">
        <div className="relative flex items-center justify-center max-w-md mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={onInputChange}
            disabled={isPaused}
            placeholder={isPaused ? 'Juego en pausa...' : 'Escribe las palabras aquí...'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-center text-body font-bold text-fg placeholder:text-fg-subtle placeholder:font-normal shadow-xs focus-ring transition-all"
            aria-label="Escribe las palabras que van cayendo"
          />
        </div>
        <p className="text-center font-caption text-tiny text-fg-subtle">
          Escribe las palabras válidas; ¡atento a la ortografía para evitar distractores!
        </p>
      </div>
    </div>
  )
}
