'use client'

// Planned structure:
// <GapPickerTabs>
//   <tab buttons />
//   <GapSuggestionCard />        (tab: sugerencias)
//   <SelfDiagnosisPicker />      (tab: autodiagnóstico)
//   <CurriculumBrowser />        (tab: catálogo)
//   <FreeformGapInput />         (tab: texto libre)
// </GapPickerTabs>

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { getTopicMetadata } from '@/lib/focus/topic-metadata'
import { topicsFromSelection, selectionNeedsPhoneme, DEFAULT_PHONEME_TARGET } from '@/lib/focus/self-diagnosis'
import type { GapSuggestion } from '@/lib/focus/gap-suggestions'
import type { SprintGap } from '@/lib/focus/types'
import { GapSuggestionCard } from './GapSuggestionCard'
import { SelfDiagnosisPicker } from './SelfDiagnosisPicker'
import { CurriculumBrowser } from './CurriculumBrowser'
import { FreeformGapInput } from './FreeformGapInput'

type Tab = 'suggestions' | 'diagnosis' | 'catalog' | 'freeform'

const TABS: { id: Tab; label: string }[] = [
  { id: 'suggestions', label: 'Sugerencias' },
  { id: 'diagnosis', label: '¿Qué se te dificulta?' },
  { id: 'catalog', label: 'Buscar tema' },
  { id: 'freeform', label: 'Describirlo' },
]

interface GapPickerTabsProps {
  suggestedGaps: GapSuggestion[]
  curriculumGaps: SprintGap[]
  selectedGaps: SprintGap[]
  onToggle: (gap: SprintGap) => void
}

function gapFromTopicId(curriculumGaps: SprintGap[], topicId: string): SprintGap | null {
  const fromCatalog = curriculumGaps.find((g) => g.targetId === topicId)
  if (fromCatalog) return fromCatalog
  const meta = getTopicMetadata(topicId)
  return { kind: meta.kind, targetId: topicId, label: topicId, level: meta.level }
}

/**
 * Las tres rutas de autodiagnóstico que pidió el usuario, más las sugerencias
 * basadas en evidencia, agrupadas en pestañas para no amontonar todo en una
 * sola pantalla larga.
 */
export function GapPickerTabs({ suggestedGaps, curriculumGaps, selectedGaps, onToggle }: GapPickerTabsProps) {
  const [tab, setTab] = useState<Tab>('suggestions')
  const [diagnosisIds, setDiagnosisIds] = useState<string[]>([])

  const selectedIds = selectedGaps.map((g) => g.targetId)
  const selectionFull = selectedGaps.length >= 2

  const handleDiagnosisToggle = (itemId: string) => {
    const next = diagnosisIds.includes(itemId)
      ? diagnosisIds.filter((id) => id !== itemId)
      : [...diagnosisIds, itemId]
    setDiagnosisIds(next)

    // El autodiagnóstico describe una situación, no un tema: al marcarla,
    // seleccionamos directamente su tema central en vez de pedir un segundo paso.
    const topicIds = topicsFromSelection(next)
    for (const topicId of topicIds) {
      const gap = gapFromTopicId(curriculumGaps, topicId)
      if (gap && !selectedIds.includes(gap.targetId) && !selectionFull) {
        onToggle(gap)
        break
      }
    }
    if (selectionNeedsPhoneme(next) && !selectedIds.includes(DEFAULT_PHONEME_TARGET.targetId) && !selectionFull) {
      onToggle({ kind: 'phoneme', targetId: DEFAULT_PHONEME_TARGET.targetId, label: DEFAULT_PHONEME_TARGET.label, level: 'a2' })
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Cómo elegir tu gap">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'focus-ring rounded-full px-3.5 py-1.5 text-body-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-sunken)] text-fg-muted hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'suggestions' && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {suggestedGaps.map((gap) => (
            <GapSuggestionCard
              key={gap.targetId}
              suggestion={gap}
              selected={selectedIds.includes(gap.targetId)}
              disabled={selectionFull && !selectedIds.includes(gap.targetId)}
              onToggle={() => onToggle(gap)}
            />
          ))}
        </div>
      )}

      {tab === 'diagnosis' && (
        <SelfDiagnosisPicker selectedIds={diagnosisIds} onToggle={handleDiagnosisToggle} />
      )}

      {tab === 'catalog' && (
        <CurriculumBrowser
          gaps={curriculumGaps}
          selectedIds={selectedIds}
          onToggle={onToggle}
          selectionFull={selectionFull}
        />
      )}

      {tab === 'freeform' && (
        <FreeformGapInput selectedIds={selectedIds} onSelect={onToggle} selectionFull={selectionFull} />
      )}
    </div>
  )
}
