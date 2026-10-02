'use client'

// Planned structure:
// <DurationSelector>
//   <KickerLabel />
//   <OptionsGrid>
//     <DurationOptionCard (3 days / 7 days / 14 days)>
//   </OptionsGrid>
// </DurationSelector>

import { cn } from '@/lib/cn'
import PastelCard from '@/components/layout/PastelCard'

interface DurationSelectorProps {
  value: number
  onChange: (days: number) => void
  disabled?: boolean
}

type OptionDef = {
  days: number
  label: string
  hint: string
  badge?: string
}

const OPTIONS: OptionDef[] = [
  { days: 3, label: '3 días', hint: 'Prueba rápida' },
  { days: 7, label: '7 días', hint: 'El equilibrio entre hábito y resultado', badge: 'RECOMENDADO' },
  { days: 14, label: '14 días', hint: 'Para afianzarlo de verdad' },
]

export function DurationSelector({ value, onChange, disabled = false }: DurationSelectorProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="ts-kicker text-fg-subtle">
        DURACIÓN DEL SPRINT
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4" role="radiogroup" aria-label="Duración del sprint">
        {OPTIONS.map((opt) => {
          const selected = value === opt.days

          if (selected) {
            return (
              <PastelCard
                key={opt.days}
                tone="lilac"
                onClick={() => !disabled && onChange(opt.days)}
                role="radio"
                aria-checked={true}
                tabIndex={0}
                className="focus-ring relative flex flex-col justify-between gap-4 rounded-3xl p-5 border-2 border-ink shadow-md cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-ink">
                    <div className="h-2 w-2 rounded-full bg-white" />
                  </div>
                  {opt.badge && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 ts-badge text-white">
                      {opt.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="ts-card-title text-ink">
                    {opt.label}
                  </h4>
                  <p className="mt-1 ts-caption text-ink-secondary">
                    {opt.hint}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-1.5 opacity-60">
                  {Array.from({ length: opt.days > 7 ? 6 : opt.days }).map((_, i) => (
                    <span key={i} className="h-2 w-2 rounded-full bg-ink" />
                  ))}
                </div>
              </PastelCard>
            )
          }

          return (
            <div
              key={opt.days}
              onClick={() => !disabled && onChange(opt.days)}
              role="radio"
              aria-checked={false}
              tabIndex={0}
              onKeyDown={(e) => {
                if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault()
                  onChange(opt.days)
                }
              }}
              className={cn(
                'focus-ring relative flex flex-col justify-between gap-4 rounded-3xl border border-border-default bg-surface-raised p-5 transition-all cursor-pointer hover:border-border-hover hover:shadow-xs',
                disabled && 'cursor-not-allowed opacity-50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-black/30 bg-white" />
                {opt.badge && (
                  <span className="rounded-full bg-primary px-2.5 py-0.5 ts-badge text-white">
                    {opt.badge}
                  </span>
                )}
              </div>

              <div>
                <h4 className="ts-card-title text-fg">
                  {opt.label}
                </h4>
                <p className="mt-1 ts-caption text-fg-muted">
                  {opt.hint}
                </p>
              </div>

              <div className="flex items-center justify-end gap-1.5 opacity-30">
                {Array.from({ length: opt.days > 7 ? 6 : opt.days }).map((_, i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-fg" />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
