'use client'

// Planned structure:
// <SelfDiagnosisPicker>
//   <SelfDiagnosisTile />   (grid de tarjetas pastel por situación)
// </SelfDiagnosisPicker>

import React from 'react'
import PastelCard, { type PastelTone } from '@/components/layout/PastelCard'
import { Check } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import { SELF_DIAGNOSIS_ITEMS, type SelfDiagnosisItem } from '@/lib/focus/self-diagnosis'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'

interface SelfDiagnosisPickerProps {
  selectedIds: string[]
  onToggle: (id: string) => void
}

const TONES: PastelTone[] = ['butter', 'coral', 'mint', 'lilac']

function getTargetLabel(item: SelfDiagnosisItem): string {
  if (item.topicIds.length === 0) {
    return 'Sonido /ɪ/ vs /iː/'
  }
  const found = TOPIC_CATALOG.find((t) => t.id === item.topicIds[0])
  return found ? found.label : item.topicIds[0]
}

function SelfDiagnosisTile({
  item,
  selected,
  tone,
  onToggle,
}: {
  item: SelfDiagnosisItem
  selected: boolean
  tone: PastelTone
  onToggle: () => void
}) {
  const Illustration = getIllustration(item.illustration)
  const targetLabel = getTargetLabel(item)

  return (
    <PastelCard
      tone={tone}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
      className={cn(
        'focus-ring relative flex flex-col justify-between gap-4 rounded-3xl p-5 sm:p-6 text-left transition-all overflow-hidden cursor-pointer hover:scale-[1.008]',
        selected
          ? 'ring-2 ring-ink ring-offset-2 shadow-md'
          : 'shadow-xs hover:shadow-md',
      )}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight leading-tight pr-4">
            {item.statement}
          </h3>
          <div
            aria-hidden="true"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all mt-1',
              selected
                ? 'border-transparent bg-ink text-white shadow-xs'
                : 'border-black/30 bg-white/90',
            )}
          >
            {selected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-4 text-body-sm text-ink-secondary font-medium shadow-xs">
          {item.example}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-3 py-1 text-tiny font-bold text-ink">
          <span className="h-2 w-2 rounded-full bg-ink" />
          <span>{targetLabel}</span>
        </span>

        <Illustration
          className="absolute bottom-3 right-3 h-16 sm:h-20 w-auto opacity-15 text-ink pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </PastelCard>
  )
}

/**
 * Selector de dificultades en situaciones cotidianas (Imagen 1).
 */
export function SelfDiagnosisPicker({ selectedIds, onToggle }: SelfDiagnosisPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5" role="group" aria-label="¿Qué se te dificulta?">
      {SELF_DIAGNOSIS_ITEMS.map((item, idx) => (
        <SelfDiagnosisTile
          key={item.id}
          item={item}
          selected={selectedIds.includes(item.id)}
          tone={TONES[idx % TONES.length]}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </div>
  )
}
