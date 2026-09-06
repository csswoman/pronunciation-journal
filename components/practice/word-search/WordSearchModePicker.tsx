'use client'

// Planned structure:
// <WordSearchModePicker>
//   <PickerHeader />       (kicker y leyenda de dificultad)
//   <SegmentedControl />   (botones de modo: 'classic' predeterminado y 'clues' difícil)
//   <ModeCaption />        (explicación clara del modo seleccionado)
// </WordSearchModePicker>

import type { WordSearchMode } from '@/lib/exercises/word-search/types'

interface Props {
  mode: WordSearchMode
  onChange: (mode: WordSearchMode) => void
}

export default function WordSearchModePicker({ mode, onChange }: Props) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <legend className="font-kicker text-fg-muted">1. Modo de juego</legend>
        <span className="text-caption text-fg-subtle">
          {mode === 'classic' ? 'Estándar · Reconocimiento ortográfico' : 'Desafío · Deducción semántica'}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Modo de juego para la sopa de letras"
        className="grid grid-cols-2 gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-1 shadow-xs"
      >
        <button
          type="button"
          role="radio"
          aria-checked={mode === 'classic'}
          onClick={() => onChange('classic')}
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-label font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
            mode === 'classic'
              ? 'border border-border-subtle/80 bg-surface-raised text-fg shadow-xs'
              : 'text-fg-muted hover:bg-surface-raised/50 hover:text-fg'
          }`}
        >
          <span>Lista visible</span>
        </button>

        <button
          type="button"
          role="radio"
          aria-checked={mode === 'clues'}
          onClick={() => onChange('clues')}
          className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-3 py-2 text-label font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
            mode === 'clues'
              ? 'border border-border-subtle/80 bg-surface-raised text-fg shadow-xs'
              : 'text-fg-muted hover:bg-surface-raised/50 hover:text-fg'
          }`}
        >
          <span>Con pistas</span>
          <span className="inline-flex items-center rounded-full bg-warning-soft px-2 py-0.5 font-mono text-caption font-bold text-warning">
            Difícil
          </span>
        </button>
      </div>

      <p className="text-pretty text-caption text-fg-muted">
        {mode === 'classic'
          ? 'Mira la lista de palabras y su pronunciación IPA directamente al lado del tablero para buscarlas.'
          : 'Modo desafío: las palabras están ocultas; dedúcelas a partir de su definición en inglés antes de marcarlas.'}
      </p>
    </fieldset>
  )
}
