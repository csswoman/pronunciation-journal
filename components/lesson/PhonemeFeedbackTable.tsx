'use client'

// Planned structure:
// <PhonemeFeedbackTable>
//   <WordNoteRow />        — palabra reconocida / no oída: una sola fila, sin juicio por sonido
//   <PhonemeDifficultyRow /> — un fonema que difiere: SONIDO | "Posible dificultad" + articulación
// </PhonemeFeedbackTable>

import { Volume2 } from '@/components/icons'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import {
  buildSttFeedbackRows,
  type PhonemeFeedbackRow,
} from '@/lib/pronunciation/phoneme-feedback-rows'
import type { WordResult } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
}

const GRID = 'grid grid-cols-[72px_1fr] gap-2'

// --- WordNoteRow ---
function WordNoteRow({ word, note }: { word: string; note: string }) {
  return (
    <div role="row" className={`${GRID} border-b border-border-subtle px-4 py-3 last:border-b-0`}>
      <div role="cell" className="text-body-sm font-semibold text-fg">
        {word}
      </div>
      <div role="cell" className="text-body-sm text-fg-muted">
        {note}
      </div>
    </div>
  )
}

// --- PhonemeDifficultyRow ---
function PhonemeDifficultyRow({
  row,
}: {
  row: Extract<PhonemeFeedbackRow, { kind: 'difficulty' }>
}) {
  const expectedIpa = `/${row.ipa}/`

  return (
    <div role="row" className={`${GRID} border-b border-border-subtle px-4 py-3 last:border-b-0`}>
      <div role="cell">
        <button
          type="button"
          onClick={() => playIpaSound(row.ipa)}
          aria-label={`Escuchar el sonido ${expectedIpa}`}
          className="group flex min-h-11 min-w-11 cursor-pointer items-center gap-1 rounded-sm border-none bg-transparent px-2 py-1 text-left text-body-lg font-semibold text-fg font-ipa transition-colors focus-ring"
        >
          {expectedIpa}
          <Volume2 size={12} aria-hidden className="opacity-40 transition-opacity group-hover:opacity-80" />
        </button>
      </div>
      <div role="cell" className="flex flex-col gap-1">
        <div className="text-body-sm font-semibold text-warning">
          Posible dificultad
          {row.gotIpa && (
            <span className="ml-1 font-normal text-fg-muted font-ipa">{`(se oyó algo como /${row.gotIpa}/)`}</span>
          )}
        </div>
        {row.articulation && (
          <p className="m-0 text-caption leading-relaxed text-fg-muted">{row.articulation}</p>
        )}
      </div>
    </div>
  )
}

/**
 * Desglose por sonido de un intento hablado.
 *
 * Se alimenta de la señal `stt_intelligibility`: el reconocedor devuelve
 * palabras, no sonidos, y tiende a corregir hacia palabras válidas. Por eso la
 * tabla nunca marca un fonema como correcto — solo señala posibles dificultades.
 * Ver `docs/architecture/adr-064-acoustic-pronunciation-assessment.md`.
 */
export function PhonemeFeedbackTable({ wordResults }: Props) {
  const rows = buildSttFeedbackRows(wordResults)

  if (rows.length === 0) return null

  return (
    <div className="flex w-full max-w-md flex-col gap-2">
      <div
        role="table"
        aria-label="Desglose de sonidos"
        className="overflow-hidden rounded-lg border border-border-subtle"
      >
        <div role="row" className={`${GRID} border-b border-border-subtle px-4 py-2 font-kicker text-fg-subtle`}>
          <span role="columnheader">Sonido</span>
          <span role="columnheader">Nota</span>
        </div>
        {rows.map((row) =>
          row.kind === 'difficulty' ? (
            <PhonemeDifficultyRow key={row.key} row={row} />
          ) : (
            <WordNoteRow
              key={row.key}
              word={row.word}
              note={row.kind === 'word_recognized' ? 'Palabra reconocida' : 'No se te oyó esta palabra'}
            />
          ),
        )}
      </div>
      <p className="m-0 text-caption leading-relaxed text-fg-subtle">
        Esto se basa en el texto que reconoció el micrófono, no en un análisis del
        sonido: sirve como pista, no como nota de pronunciación.
      </p>
    </div>
  )
}
