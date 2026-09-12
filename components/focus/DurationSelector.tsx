'use client'

import { cn } from '@/lib/cn'

interface DurationSelectorProps {
  value: number
  onChange: (days: number) => void
  disabled?: boolean
}

const OPTIONS: { days: number; label: string; hint: string }[] = [
  { days: 3, label: '3 días', hint: 'Prueba rápida' },
  { days: 7, label: '7 días', hint: 'Recomendado' },
  { days: 14, label: '14 días', hint: 'Afianzar bien' },
]

/**
 * Duración del sprint. `createSprint` ya acepta `durationDays`; la pantalla
 * anterior lo dejaba fijo en 7 sin decírselo al usuario.
 */
export function DurationSelector({ value, onChange, disabled = false }: DurationSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm font-semibold text-fg">Duración del sprint</span>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Duración del sprint">
        {OPTIONS.map((opt) => {
          const selected = value === opt.days
          return (
            <button
              key={opt.days}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(opt.days)}
              className={cn(
                'focus-ring flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2.5 text-center transition-colors disabled:opacity-60',
                selected
                  ? 'border-[var(--primary)] bg-[var(--primary-soft)]'
                  : 'border-[var(--border-default)] bg-[var(--surface-base)] hover:bg-[var(--surface-raised)]',
              )}
            >
              <span className={cn('text-body-sm font-semibold', selected ? 'text-[var(--primary)]' : 'text-fg')}>
                {opt.label}
              </span>
              <span className="text-tiny text-fg-subtle">{opt.hint}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
