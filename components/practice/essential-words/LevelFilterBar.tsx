'use client'

// Planned structure:
// <LevelFilterBar>
//   <LevelToggle "Todos" />        — clears the filter (all levels)
//   <LevelToggle A1..C1 />         — multi-select CEFR level toggles
// </LevelFilterBar>

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
  const allActive = !value || value.length === 0

  return (
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
        'rounded-full border px-2.5 py-1 text-tiny font-semibold uppercase tracking-[0.12em]',
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
