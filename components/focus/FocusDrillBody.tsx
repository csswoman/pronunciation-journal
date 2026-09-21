'use client'

// Planned structure:
// <FocusDrillBody>
//   <DrillSentenceRow />   (xN)
//   <DrillControls />
// </FocusDrillBody>

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import type { DrillBody } from '@/lib/focus/types'

interface FocusDrillBodyProps {
  body: DrillBody
  isPracticing?: boolean
  onStartPractice?: () => void
}

const PAGE_SIZE = 3

function renderHighlightedText(text: string, gapWord: string) {
  if (!gapWord) return text
  const escapedGapWord = gapWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedGapWord})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) =>
    part.toLowerCase() === gapWord.toLowerCase() ? (
      <mark
        key={index}
        className="bg-transparent underline font-semibold text-[var(--primary)] text-primary"
      >
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

/** Lista de oraciones del drill con su traducción y la forma objetivo resaltada. */
export function FocusDrillBody({ body, isPracticing = false, onStartPractice }: FocusDrillBodyProps) {
  const [page, setPage] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  const totalPages = Math.ceil(body.sentences.length / PAGE_SIZE)
  const visibleSentences = body.sentences.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleCopy = async () => {
    const formatted = body.sentences
      .map((s, idx) => `${idx + 1}. ${s.text} (${s.translation}) [Objetivo: ${s.gapWord}]`)
      .join('\n')
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(formatted)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('error')
    }
  }

  const renderContent = () => (
    <div className="space-y-4">
      <ol className="space-y-3">
        {visibleSentences.map((sentence, index) => (
          <li
            key={index}
            className="p-4 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-default)]"
          >
            <p className="text-body text-[var(--text-primary)] leading-relaxed">
              {renderHighlightedText(sentence.text, sentence.gapWord)}
            </p>
            <p className="text-body-sm text-[var(--text-secondary)] mt-1">
              {sentence.translation}
            </p>
            <span className="inline-block mt-2 text-tiny font-semibold px-2 py-0.5 rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
              {sentence.gapWord}
            </span>
          </li>
        ))}
      </ol>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anteriores
          </Button>
          <span className="text-tiny text-[var(--text-secondary)] font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguientes
          </Button>
        </div>
      )}

      {!isPracticing && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[var(--border-subtle)]">
          {onStartPractice && (
            <Button onClick={onStartPractice}>
              Practicar
            </Button>
          )}
          <Button variant="secondary" onClick={handleCopy}>
            Copiar frases
          </Button>
          {copyStatus === 'copied' && (
            <p className="text-body-sm text-success" role="status">
              Frases copiadas.
            </p>
          )}
          {copyStatus === 'error' && (
            <p className="text-body-sm text-error" role="alert">
              No se pudieron copiar las frases. Inténtalo de nuevo.
            </p>
          )}
        </div>
      )}
    </div>
  )

  if (isPracticing) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-body-sm font-semibold text-[var(--text-primary)]">
            Frases de referencia del drill
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? 'Ocultar frases' : 'Consultar frases'}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            {renderContent()}
          </div>
        )}
      </div>
    )
  }

  return renderContent()
}
