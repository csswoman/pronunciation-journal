'use client'

// Planned structure:
// <CurriculumBrowser>
//   <SearchHeaderInput />
//   <BrowserLayout>
//     <CategoryAndLevelSidebar />
//     <MainTopicCatalogGrid>
//       <TopicPastelCard />
//     </MainTopicCatalogGrid>
//   </BrowserLayout>
// </CurriculumBrowser>

import React, { useMemo, useState } from 'react'
import Input from '@/components/ui/Input'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getTopicMetadata, TOPIC_FAMILY_LABELS, type TopicFamily } from '@/lib/focus/topic-metadata'
import type { SprintGap } from '@/lib/focus/types'

interface CurriculumBrowserProps {
  gaps: SprintGap[]
  selectedIds: string[]
  onToggle: (gap: SprintGap) => void
  selectionFull: boolean
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

const CATEGORIES: { id: TopicFamily | 'all'; label: string; dotColor: string }[] = [
  { id: 'tiempos', label: 'Tiempos verbales', dotColor: 'bg-sky-deep' },
  { id: 'estructura', label: 'Preguntas y estructura', dotColor: 'bg-mint-deep' },
  { id: 'palabras', label: 'Artículos y preposiciones', dotColor: 'bg-lilac-deep' },
  { id: 'vocabulario', label: 'Vocabulario', dotColor: 'bg-coral-deep' },
]

const LEVELS = ['Todos', 'A1', 'A2', 'B1', 'B2'] as const

const FAMILY_DESCRIPTIONS: Record<TopicFamily, string> = {
  tiempos: 'Expresa pasado, presente y futuro con fluidez.',
  estructura: 'Domina el orden natural de las oraciones en inglés.',
  palabras: 'Artículos, preposiciones y conectores esenciales.',
  vocabulario: 'Vocabulario y frases idiomáticas para sonar natural.',
}

const CARD_TONES: PastelTone[] = ['sky', 'butter', 'mint', 'lilac']

export function CurriculumBrowser({
  gaps,
  selectedIds,
  onToggle,
  selectionFull,
}: CurriculumBrowserProps) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<TopicFamily | 'all'>('tiempos')
  const [selectedLevel, setSelectedLevel] = useState<string>('Todos')

  const filteredGaps = useMemo(() => {
    const q = normalize(query.trim())

    return gaps.filter((gap) => {
      const meta = getTopicMetadata(gap.targetId)

      if (selectedCategory !== 'all' && meta.family !== selectedCategory) {
        return false
      }

      if (selectedLevel !== 'Todos' && gap.level.toUpperCase() !== selectedLevel) {
        return false
      }

      if (q) {
        const haystack = normalize(`${gap.label} ${meta.wrong} ${meta.right} ${gap.level}`)
        if (!haystack.includes(q)) return false
      }

      return true
    })
  }, [gaps, query, selectedCategory, selectedLevel])

  const activeCategoryLabel = selectedCategory === 'all'
    ? 'Todos los temas'
    : TOPIC_FAMILY_LABELS[selectedCategory]

  const activeCategoryDesc = selectedCategory === 'all'
    ? 'Explora el catálogo por nivel o palabra clave.'
    : FAMILY_DESCRIPTIONS[selectedCategory]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap">
        <div className="w-full">
          <Input
            label=""
            type="search"
            value={query}
            onChange={setQuery}
            placeholder="Q Busca un tema o ejemplo: -ed, sheep, preguntas..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start gap-6">
        <aside className="w-full sm:w-64 shrink-0 flex flex-col gap-4 rounded-3xl border border-border-default bg-surface-raised p-4 shadow-xs">
          <div className="flex flex-col gap-2">
            <span className="text-tiny font-bold uppercase tracking-wider text-fg-subtle px-2">
              CATEGORÍAS
            </span>
            <div className="flex flex-col gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                      'focus-ring flex items-center gap-2.5 rounded-2xl px-3.5 py-2.5 text-body-sm font-semibold transition-all text-left cursor-pointer',
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
                    )}
                  >
                    <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', isActive ? 'bg-white' : cat.dotColor)} />
                    <span className="truncate">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-3 border-t border-border-subtle">
            <span className="text-tiny font-bold uppercase tracking-wider text-fg-subtle px-2">
              NIVEL
            </span>
            <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-surface-sunken">
              {LEVELS.map((lvl) => {
                const isActive = selectedLevel === lvl
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={cn(
                      'focus-ring flex-1 rounded-xl px-3 py-1.5 text-tiny font-bold transition-all text-center cursor-pointer',
                      isActive
                        ? 'bg-cta-bg text-cta-fg shadow-xs'
                        : 'text-fg-muted hover:text-fg hover:bg-surface-raised',
                    )}
                  >
                    {lvl}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>

        <main className="flex-1 w-full flex flex-col gap-4">
          <div>
            <span className="text-tiny font-bold uppercase tracking-wider text-fg-subtle">
              GRAMÁTICA
            </span>
            <h3 className="font-display text-3xl sm:text-4xl font-extrabold text-fg tracking-tight">
              {activeCategoryLabel}
            </h3>
            <p className="text-body-sm text-fg-muted mt-0.5">
              {activeCategoryDesc}
            </p>
          </div>

          {filteredGaps.length === 0 ? (
            <p className="py-8 text-center text-body-sm text-fg-muted rounded-3xl border border-dashed border-border-default p-6">
              Ningún tema coincide con los filtros aplicados. Pruebe seleccionando otros niveles o categorías.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {filteredGaps.map((gap, idx) => {
                const isSelected = selectedIds.includes(gap.targetId)
                const meta = getTopicMetadata(gap.targetId)
                const isDisabled = selectionFull && !isSelected
                const tone = CARD_TONES[idx % CARD_TONES.length]

                return (
                  <PastelCard
                    key={gap.targetId}
                    tone={tone}
                    onClick={() => !isDisabled && onToggle(gap)}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-disabled={isDisabled}
                    tabIndex={isDisabled ? -1 : 0}
                    className={cn(
                      'focus-ring relative flex flex-col justify-between gap-3 rounded-3xl p-5 text-left transition-all cursor-pointer hover:scale-[1.008]',
                      isDisabled && 'cursor-not-allowed opacity-55',
                      isSelected
                        ? 'ring-2 ring-ink ring-offset-2 shadow-md'
                        : 'shadow-xs hover:shadow-md',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center rounded-full bg-black/10 px-2.5 py-0.5 text-tiny font-extrabold text-ink">
                        {gap.level.toUpperCase()}
                      </span>
                      <div
                        aria-hidden="true"
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all',
                          isSelected
                            ? 'border-transparent bg-ink text-white shadow-xs'
                            : 'border-black/30 bg-white/80',
                        )}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    <h4 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                      {gap.label}
                    </h4>

                    {meta.wrong && meta.right ? (
                      <div className="flex flex-col gap-1 rounded-2xl bg-white/90 p-3.5 text-tiny text-ink shadow-xs">
                        <div className="flex items-center gap-1.5 text-red-600">
                          <span className="font-bold">✕</span>
                          <span className="line-through decoration-1 opacity-80">{meta.wrong}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-800 font-semibold">
                          <span className="font-bold">✓</span>
                          <span>{meta.right}</span>
                        </div>
                      </div>
                    ) : meta.right ? (
                      <div className="rounded-2xl bg-white/90 p-3.5 text-tiny text-ink font-medium shadow-xs">
                        {meta.right}
                      </div>
                    ) : null}
                  </PastelCard>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
