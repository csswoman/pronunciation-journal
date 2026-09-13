'use client'

// Planned structure:
// <FreeformGapInput>
//   <textarea + submit />
//   <match list />   (resultados con confianza y motivo)

import React, { useState } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { getTopicMetadata } from '@/lib/focus/topic-metadata'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'
import type { SprintGap } from '@/lib/focus/types'

interface GapMatch {
  topicId: string
  confidence: number
  rationale: string
}

interface FreeformGapInputProps {
  selectedIds: string[]
  onSelect: (gap: SprintGap) => void
  selectionFull: boolean
}

const MAX_LENGTH = 300

/** Bajo esta confianza el resultado se rotula como aproximado, no como certeza. */
const LOW_CONFIDENCE = 0.6

function labelFor(topicId: string): string {
  return TOPIC_CATALOG.find((t) => t.id === topicId)?.label ?? topicId
}

/**
 * Entrada de dificultad en las palabras del usuario.
 *
 * Gemini mapea la descripción a temas del catálogo; el endpoint filtra
 * cualquier id inventado antes de devolverlo. El usuario siempre confirma el
 * tema: la coincidencia se propone, nunca se selecciona sola.
 */
const PROMPT_SUGGESTIONS = [
  'Diferenciar preposiciones (in, on, at)',
  'Pronunciar verbos en pasado con -ed',
  'Cuándo usar "I did" vs "I have done"',
  'Hacer preguntas sin dudar',
]

export function FreeformGapInput({ selectedIds, onSelect, selectionFull }: FreeformGapInputProps) {
  const [description, setDescription] = useState('')
  const [matches, setMatches] = useState<GapMatch[] | null>(null)
  const [clarification, setClarification] = useState<string | null>(null)
  const [isMatching, setIsMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = description.trim().length >= 3 && !isMatching

  const performMatch = async (text: string) => {
    if (text.trim().length < 3 || isMatching) return
    setIsMatching(true)
    setError(null)
    setClarification(null)

    try {
      const res = await fetch('/api/gemini/focus/match-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() }),
      })

      if (!res.ok) throw new Error('No pudimos interpretar tu descripción ahora mismo.')

      const data: { matches: GapMatch[]; clarification: string | null } = await res.json()
      setMatches(data.matches)
      setClarification(data.clarification)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado.')
      setMatches(null)
    } finally {
      setIsMatching(false)
    }
  }

  const handleSubmit = () => performMatch(description)

  const handleChipClick = (prompt: string) => {
    setDescription(prompt)
    performMatch(prompt)
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-xl border border-border-default bg-surface-raised p-4 shadow-xs">
      <div>
        <label htmlFor="freeform-gap" className="text-body-sm font-medium text-fg">
          Descríbelo con tus palabras
        </label>
        <p className="text-tiny text-fg-muted">
          Escribe lo que te pasa al hablar o elige una idea rápida de abajo.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PROMPT_SUGGESTIONS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleChipClick(prompt)}
            disabled={isMatching}
            className="focus-ring rounded-full border border-border-subtle bg-surface-sunken px-2.5 py-1 text-tiny text-fg-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary disabled:opacity-50"
          >
            {prompt}
          </button>
        ))}
      </div>

      <textarea
        id="freeform-gap"
        value={description}
        onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTH))}
        rows={3}
        placeholder="Ej: cuando hablo de algo que ya pasó me trabo y no sé si decir I did o I have done"
        className="focus-ring w-full resize-y rounded-lg border border-border-default bg-surface-sunken p-3 text-body-sm text-fg placeholder:text-fg-subtle transition-colors"
      />

      <div className="flex items-center justify-between gap-3">
        <span className="text-tiny text-fg-subtle">
          {description.length}/{MAX_LENGTH}
        </span>
        <Button variant="secondary" onClick={handleSubmit} disabled={!canSubmit} isLoading={isMatching}>
          {isMatching ? 'Buscando tu tema...' : 'Buscar mi tema'}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-error-soft p-3 text-body-sm text-error">{error}</p>
      )}

      {clarification && (
        <p className="rounded-lg bg-surface-sunken p-3 text-body-sm text-fg-muted">{clarification}</p>
      )}

      {matches && matches.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border-subtle">
          <span className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
            Esto es lo que encontramos
          </span>
          {matches.map((match) => {
            const isSelected = selectedIds.includes(match.topicId)
            const meta = getTopicMetadata(match.topicId)
            const label = labelFor(match.topicId)
            const isDisabled = selectionFull && !isSelected

            return (
              <button
                key={match.topicId}
                type="button"
                role="checkbox"
                aria-checked={isSelected}
                aria-disabled={isDisabled}
                onClick={() =>
                  onSelect({
                    kind: meta.kind,
                    targetId: match.topicId,
                    label,
                    level: meta.level,
                  })
                }
                className={cn(
                  'focus-ring flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors',
                  isDisabled && 'cursor-not-allowed opacity-55',
                  isSelected
                    ? 'border-primary bg-primary-soft shadow-xs'
                    : 'border-border-default bg-surface-base hover:bg-surface-sunken hover:border-border-hover',
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-body-sm font-semibold text-fg">{label}</span>
                  <Badge label={meta.level.toUpperCase()} variant="neutral" size="sm" />
                </span>
                <span className="text-tiny text-fg-muted">{match.rationale}</span>
                {match.confidence < LOW_CONFIDENCE && (
                  <span className="text-tiny text-warning">
                    Coincidencia aproximada. Revisa que sea lo que buscas.
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

