'use client'

// Planned structure:
// <CurriculumBrowser>
//   <search input />
//   <family group />   (uno por familia con resultados)

import React, { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
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

/**
 * Catálogo completo con búsqueda y agrupación por familia.
 *
 * La versión anterior era una lista plana de 27 botones dentro de un panel con
 * scroll de 240px, sin nivel ni ejemplo. Aquí cada tema muestra su nivel CEFR
 * real y la búsqueda cubre también el ejemplo, así que escribir "ed" o "sheep"
 * encuentra el tema aunque el usuario no sepa cómo se llama.
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
        label="Buscar tema del currículo"
        type="search"
        value={query}
        onChange={setQuery}
        placeholder="Busca un tema o un ejemplo: -ed, sheep, preguntas…"
      />

      {totalResults === 0 ? (
        <p className="py-4 text-center text-body-sm text-fg-muted">
          Ningún tema coincide con “{query}”. Prueba con el buscador de arriba o descríbelo con tus palabras.
        </p>
      ) : (
        grouped.map(({ family, items }) => (
          <div key={family} className="flex flex-col gap-2">
            <h4 className="text-tiny font-semibold uppercase tracking-wider text-fg-subtle">
              {TOPIC_FAMILY_LABELS[family]}
            </h4>
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
                      'focus-ring flex flex-col gap-1 rounded-lg border p-2.5 text-left transition-colors',
                      isDisabled && 'cursor-not-allowed opacity-55',
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                        : 'border-[var(--border-default)] bg-[var(--surface-base)] hover:bg-[var(--surface-raised)]',
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('text-body-sm', isSelected ? 'font-semibold text-[var(--primary)]' : 'text-fg')}>
                        {gap.label}
                      </span>
                      <span className="shrink-0 text-tiny font-medium text-fg-subtle">
                        {gap.level.toUpperCase()}
                      </span>
                    </span>
                    {meta.right && (
                      <span className="text-tiny text-fg-subtle">{meta.right}</span>
                    )}
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
