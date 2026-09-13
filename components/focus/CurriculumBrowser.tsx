'use client'

// Planned structure:
// <CurriculumBrowser>
//   <search input />
//   <family group />   (uno por familia con resultados)

import React, { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { cn } from '@/lib/cn'
import { getTopicMetadata, TOPIC_FAMILY_LABELS, type TopicFamily } from '@/lib/focus/topic-metadata'
import type { SprintGap } from '@/lib/focus/types'

interface CurriculumBrowserProps {
  gaps: SprintGap[]
  selectedIds: string[]
  onToggle: (gap: SprintGap) => void
  selectionFull: boolean
}

/** Normaliza para buscar sin acentos ni mayúsculas. */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const FAMILY_ORDER: TopicFamily[] = ['tiempos', 'estructura', 'palabras', 'vocabulario']

const FAMILY_DESCRIPTIONS: Record<TopicFamily, string> = {
  tiempos: 'Expresa pasado, presente y futuro con fluidez temporal.',
  estructura: 'Domina el orden natural de las oraciones en inglés.',
  palabras: 'Artículos, preposiciones y conectores esenciales.',
  vocabulario: 'Vocabulario y frases idiomáticas para sonar natural.',
}

/**
 * Catálogo completo con búsqueda y agrupación por familia.
 *
 * Cada tema muestra su nivel CEFR estructurado con Badge y el contraste
 * de ejemplo (error frecuente → forma correcta) para máxima claridad.
 */
export function CurriculumBrowser({
  gaps,
  selectedIds,
  onToggle,
  selectionFull,
}: CurriculumBrowserProps) {
  const [query, setQuery] = useState('')

  const grouped = useMemo(() => {
    const q = normalize(query.trim())
    const groups = new Map<TopicFamily, SprintGap[]>()

    for (const gap of gaps) {
      const meta = getTopicMetadata(gap.targetId)
      const haystack = normalize(`${gap.label} ${meta.wrong} ${meta.right} ${gap.level}`)
      if (q && !haystack.includes(q)) continue

      const list = groups.get(meta.family) ?? []
      list.push(gap)
      groups.set(meta.family, list)
    }

    return FAMILY_ORDER.filter((f) => groups.has(f)).map((family) => ({
      family,
      items: groups.get(family)!,
    }))
  }, [gaps, query])

  const totalResults = grouped.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Buscar tema del catálogo"
        type="search"
        value={query}
        onChange={setQuery}
        placeholder="Busca un tema o un ejemplo: -ed, sheep, preguntas…"
      />

      {totalResults === 0 ? (
        <p className="py-4 text-center text-body-sm text-fg-muted">
          Ningún tema coincide con “{query}”. Prueba con otra palabra clave o descríbelo con tus palabras.
        </p>
      ) : (
        grouped.map(({ family, items }) => (
          <div key={family} className="flex flex-col gap-2">
            <div>
              <h4 className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
                {TOPIC_FAMILY_LABELS[family]}
              </h4>
              <p className="text-tiny text-fg-muted">
                {FAMILY_DESCRIPTIONS[family]}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {items.map((gap) => {
                const isSelected = selectedIds.includes(gap.targetId)
                const meta = getTopicMetadata(gap.targetId)
                const isDisabled = selectionFull && !isSelected

                return (
                  <button
                    key={gap.targetId}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-disabled={isDisabled}
                    onClick={() => onToggle(gap)}
                    className={cn(
                      'focus-ring flex flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors',
                      isDisabled && 'cursor-not-allowed opacity-55',
                      isSelected
                        ? 'border-primary bg-primary-soft shadow-xs'
                        : 'border-border-default bg-surface-raised hover:bg-surface-sunken hover:border-border-hover shadow-xs',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('text-body-sm', isSelected ? 'font-semibold text-primary' : 'font-medium text-fg')}>
                        {gap.label}
                      </span>
                      <Badge label={gap.level.toUpperCase()} variant="neutral" size="sm" />
                    </span>
                    {meta.wrong && meta.right ? (
                      <div className="flex flex-wrap items-center gap-1.5 text-tiny leading-tight">
                        <span className="line-through decoration-1 text-warning/90">{meta.wrong}</span>
                        <span className="text-fg-subtle">→</span>
                        <span className="font-medium text-success">{meta.right}</span>
                      </div>
                    ) : meta.right ? (
                      <span className="text-tiny text-fg-subtle">{meta.right}</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

