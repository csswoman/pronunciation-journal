'use client'

// Planned structure:
// <PhonemeFeedbackTable>
//   <PhonemeRow />   — un fonema: SONIDO | DIJISTE/¡Excelente! + articulación
// </PhonemeFeedbackTable>

import { Volume2 } from 'lucide-react'
import { getArticulation } from '@/lib/pronunciation/articulation'
import { playIpaSound } from '@/lib/pronunciation/ipa-audio'
import type { PhonemeAlignment, WordResult } from '@/lib/types'

interface Props {
  wordResults: WordResult[]
}

interface FlatPhoneme extends PhonemeAlignment {
  key: string
}

// --- PhonemeRow ---
function PhonemeRow({ p }: { p: FlatPhoneme }) {
  const ipa = p.ipa ?? p.phoneme
  const expectedIpa = `/${ipa}/`
  const isCorrect = p.status === 'correct'

  const articulation = getArticulation(ipa)

  return (
    <div role="row" className="grid grid-cols-[72px_1fr] gap-2 px-4 py-3 border-b border-[var(--border-subtle)] last:border-b-0">
      <div role="cell">
        <button
          type="button"
          onMouseEnter={() => playIpaSound(ipa)}
          onClick={() => playIpaSound(ipa)}
          aria-label={`Escuchar el sonido ${expectedIpa}`}
          className="group flex items-center gap-1 text-left text-lg font-semibold text-[var(--text-primary)] [font-family:var(--font-ipa),monospace] cursor-pointer bg-transparent border-none p-0"
        >
          {expectedIpa}
          <Volume2 size={12} aria-hidden className="opacity-40 transition-opacity group-hover:opacity-80" />
        </button>
      </div>
      {isCorrect ? (
        <div role="cell" className="text-sm font-semibold text-[var(--success)]">¡Excelente!</div>
      ) : (
        <div role="cell" className="flex flex-col gap-1">
          <div className="text-base font-semibold text-[var(--error)] [font-family:var(--font-ipa),monospace]">
            {p.status === 'missing' ? '—' : p.gotIpa ? `/${p.gotIpa}/` : `/${p.got}/`}
          </div>
          {articulation && (
            <p className="text-xs leading-relaxed text-[var(--text-secondary)] m-0">
              {articulation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PhonemeFeedbackTable({ wordResults }: Props) {
  const phonemes: FlatPhoneme[] = wordResults.flatMap((w, wi) =>
    (w.phonemes?.alignment ?? []).map((p, pi) => ({ ...p, key: `${wi}-${pi}` })),
  )

  if (phonemes.length === 0) return null

  return (
    <div
      role="table"
      aria-label="Desglose de sonidos"
      className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--border-subtle)] overflow-hidden"
    >
      <div role="row" className="grid grid-cols-[72px_1fr] gap-2 px-4 py-2 border-b border-[var(--border-subtle)] text-xs font-semibold uppercase tracking-[.05em] text-[var(--text-tertiary)]">
        <span role="columnheader">Sonido</span>
        <span role="columnheader">Dijiste</span>
      </div>
      {phonemes.map((p) => (
        <PhonemeRow key={p.key} p={p} />
      ))}
    </div>
  )
}
