'use client'

// Planned structure:
// <LevelFilterBar>
//   <LevelToggle "Todos" />        — clears the filter (all levels)
//   <LevelToggle A1..C1 />         — multi-select CEFR level toggles
// </LevelFilterBar>

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { CEFR_LEVELS, type CefrLevel } from '@/lib/core-1000/types'

interface Props {
  /** Active levels, or null when practising all levels. */
  value: CefrLevel[] | null
  onChange: (levels: CefrLevel[] | null) => void
  disabled?: boolean
}

function toggle(current: CefrLevel[] | null, level: CefrLevel): CefrLevel[] {
  const set = new Set(current ?? [])
  if (set.has(level)) set.delete(level)
  else set.add(level)
  return CEFR_LEVELS.filter((l) => set.has(l))
}

export function LevelFilterBar({ value, onChange, disabled }: Props) {
  const [expanded, setExpanded] = useState(false)
  const allActive = !value || value.length === 0
  const summary = allActive
    ? 'Todos los niveles'
    : value.length === 1
      ? `Tu nivel: ${value[0]}`
      : `Niveles: ${value.join(', ')}`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-caption">
        <span className="font-medium text-fg-muted">{summary}</span>
        <button
          type="button"
          aria-expanded={expanded}
          disabled={disabled}
          onClick={() => setExpanded((open) => !open)}
          className="min-h-11 rounded-md px-3 py-1 text-caption font-semibold text-primary transition-colors hover:bg-primary-soft focus-ring disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cambiar
        </button>
      </div>
      {expanded && (
        <div
          role="group"
          aria-label="Filtrar por nivel CEFR"
          className="flex flex-wrap items-center justify-center gap-1.5"
        >
          <LevelChip label="Todos" active={allActive} disabled={disabled} onClick={() => onChange(null)} />
          {CEFR_LEVELS.map((level) => (
            <LevelChip
              key={level}
              label={level}
              active={!allActive && value!.includes(level)}
              disabled={disabled}
              onClick={() => onChange(toggle(value, level))}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LevelChip({
  label, active, disabled, onClick,
}: { label: string; active: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 rounded-full border px-3 py-1 text-caption font-semibold',
        'transition-colors duration-150 focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        active
          ? 'border-primary bg-primary text-on-primary'
          : 'border-border-subtle bg-transparent text-fg-subtle hover:bg-surface-sunken',
      )}
    >
      {label}
    </button>
  )
}
