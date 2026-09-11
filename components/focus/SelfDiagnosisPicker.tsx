'use client'

// Planned structure:
// <SelfDiagnosisPicker>
//   <SelfDiagnosisTile />   (uno por situación)

import React from 'react'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import { SELF_DIAGNOSIS_ITEMS, type SelfDiagnosisItem } from '@/lib/focus/self-diagnosis'

interface SelfDiagnosisPickerProps {
  selectedIds: string[]
  onToggle: (id: string) => void
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

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={cn(
        'focus-ring flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
        selected
          ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
          : 'border-[var(--border-default)] bg-[var(--surface-raised)] hover:border-[var(--border-hover)]',
      )}
    >
      <Illustration
        className={cn('h-10 w-auto shrink-0', selected ? 'text-[var(--primary)]' : 'text-fg-subtle')}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-medium text-fg">{item.statement}</span>
        <span className="mt-0.5 block text-tiny text-fg-subtle">{item.example}</span>
      </span>
    </button>
  )
}

/**
 * Selector de dificultades en situaciones cotidianas.
 *
 * Existe porque la lista de temas del catálogo asume que el usuario reconoce
 * nombres como "cuantificadores". Aquí describe lo que le pasa al hablar y el
 * mapeo a temas ocurre después, en `topicsFromSelection`.
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
