'use client'

// Planned structure:
// <JournalVocabOverlay>
//   texto dividido en segmentos planos + <mark> por cada palabra de vocab usada
// </JournalVocabOverlay>
//
// Se monta sobre el textarea con position:absolute, pointer-events:none.
// El texto es transparent — solo se ve el fondo del <mark>.

import { useMemo } from 'react'
import { seedWordIsUsed } from '@/lib/journal/writing-hints/seed-progress'

interface JournalVocabOverlayProps {
  content: string
  /** Textos base de las palabras de vocab (e.g. ["reply", "remember"]). */
  vocabWords: string[]
}

interface Segment {
  text: string
  isVocab: boolean
}

export function JournalVocabOverlay({ content, vocabWords }: JournalVocabOverlayProps) {
  const segments = useMemo(
    () => buildSegments(content, vocabWords),
    [content, vocabWords],
  )

  const hasHighlights = segments.some((s) => s.isVocab)
  if (!hasHighlights) return null

  return (
    <div
      aria-hidden
      // Mirrors JournalEditor textarea: same font, padding, leading.
      // text-transparent so only the mark background shows through.
      className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words p-5 font-body text-base leading-relaxed text-transparent"
    >
      {segments.map((seg, i) =>
        seg.isVocab ? (
          <mark
            key={i}
            className="rounded-[0.2em] bg-primary/20 text-transparent"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
      {/* Trailing newline so the div height matches the textarea exactly */}
      {'\n'}
    </div>
  )
}

/**
 * Parte el texto en segmentos: palabras de vocab usadas vs. texto plano.
 * Usa la misma lógica de inflexión que seedWordIsUsed para consistencia.
 */
function buildSegments(content: string, vocabWords: string[]): Segment[] {
  if (!content || vocabWords.length === 0) return [{ text: content, isVocab: false }]

  // Tokeniza preservando los separadores (espacios, puntuación, saltos de línea)
  const TOKEN_RE = /([A-Za-zÀ-ÿ']+|[^A-Za-zÀ-ÿ']+)/g
  const parts = content.match(TOKEN_RE) ?? []

  return parts.map((part) => {
    // Solo verificar tokens alfabéticos
    if (!/^[A-Za-zÀ-ÿ']/.test(part)) return { text: part, isVocab: false }

    const isVocab = vocabWords.some((word) =>
      seedWordIsUsed(word, part),
    )
    return { text: part, isVocab }
  })
}
