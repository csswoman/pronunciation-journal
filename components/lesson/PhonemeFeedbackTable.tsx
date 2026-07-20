'use client'

// Planned structure:
// <PhonemeFeedbackTable>
//   <PhonemeRow />   — un fonema: SONIDO | DIJISTE/¡Excelente! + articulación
// </PhonemeFeedbackTable>

import { Volume2 } from "@/components/icons"
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
    <div role="row" className="grid grid-cols-[72px_1fr] gap-2 border-b border-border-subtle px-4 py-3 last:border-b-0">
      <div role="cell">
        <button
          type="button"
          onMouseEnter={() => playIpaSound(ipa)}
          onClick={() => playIpaSound(ipa)}
          aria-label={`Escuchar el sonido ${expectedIpa}`}
          className="group flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left text-lg font-semibold text-fg font-ipa"
        >
          {expectedIpa}
          <Volume2 size={12} aria-hidden className="opacity-40 transition-opacity group-hover:opacity-80" />
        </button>
      </div>
      {isCorrect ? (
        <div role="cell" className="text-sm font-semibold text-success">¡Excelente!</div>
      ) : (
        <div role="cell" className="flex flex-col gap-1">
          <div className="text-base font-semibold text-error font-ipa">
            {p.status === 'missing' ? 'No registrado' : p.gotIpa ? `/${p.gotIpa}/` : `/${p.got}/`}
          </div>
          {articulation && (
            <p className="m-0 text-xs leading-relaxed text-fg-muted">
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
      className="w-full max-w-md overflow-hidden rounded-lg border border-border-subtle"
    >
      <div role="row" className="grid grid-cols-[72px_1fr] gap-2 border-b border-border-subtle px-4 py-2 text-xs font-semibold uppercase tracking-[.05em] text-fg-subtle">
        <span role="columnheader">Sonido</span>
        <span role="columnheader">Dijiste</span>
      </div>
      {phonemes.map((p) => (
        <PhonemeRow key={p.key} p={p} />
      ))}
    </div>
  )
}
