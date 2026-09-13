'use client'

// Planned structure:
// <SelfDiagnosisPicker>
//   <SelfDiagnosisTile />   (uno por situación)

import React from 'react'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import { SELF_DIAGNOSIS_ITEMS, type SelfDiagnosisItem } from '@/lib/focus/self-diagnosis'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'

interface SelfDiagnosisPickerProps {
  selectedIds: string[]
  onToggle: (id: string) => void
}

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
  onToggle,
}: {
  item: SelfDiagnosisItem
  selected: boolean
  onToggle: () => void
}) {
  // Las ilustraciones no son una grilla cuadrada: fijar un solo eje evita
  // deformarlas (ver lib/illustrations/registry.ts).
  const Illustration = getIllustration(item.illustration)
  const targetLabel = getTargetLabel(item)

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'focus-ring flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors',
        selected
          ? 'border-primary bg-primary-soft shadow-xs'
          : 'border-border-default bg-surface-raised hover:border-border-hover',
      )}
    >
      <Illustration
        className={cn('h-10 w-auto shrink-0', selected ? 'text-primary' : 'text-fg-subtle')}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-medium text-fg">{item.statement}</span>
        <span className="mt-0.5 block text-tiny text-fg-subtle">{item.example}</span>
        <span
          className={cn(
            'mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-tiny font-medium transition-colors',
            selected
              ? 'bg-primary text-on-primary'
              : 'bg-surface-sunken text-fg-muted',
          )}
        >
          <span className="opacity-70">Foco:</span> {targetLabel}
        </span>
      </span>
    </button>
  )
}

/**
 * Selector de dificultades en situaciones cotidianas.
 *
 * Permite al usuario describir lo que le pasa al hablar y el mapeo a temas
 * ocurre en topicsFromSelection.
 */
export function SelfDiagnosisPicker({ selectedIds, onToggle }: SelfDiagnosisPickerProps) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label="¿Qué se te hace difícil?">
      {SELF_DIAGNOSIS_ITEMS.map((item) => (
        <SelfDiagnosisTile
          key={item.id}
          item={item}
          selected={selectedIds.includes(item.id)}
          onToggle={() => onToggle(item.id)}
        />
      ))}
    </div>
  )
}

