'use client'

// Planned structure:
// <RoutePicker>
//   <select> — "Libre" + one option per themed VOCAB_ROUTES entry
// </RoutePicker>
// A themed route is a curated CEFR-level + part-of-speech slice (e.g. "Verbos B1").

import { cn } from '@/lib/cn'
import { VOCAB_ROUTES, getRoute } from '@/lib/core-1000/routes'

interface Props {
  value: string | null
  onChange: (routeId: string | null) => void
  disabled?: boolean
}

export function RoutePicker({ value, onChange, disabled }: Props) {
  const active = getRoute(value)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <label className="flex items-center gap-2">
        <span className="font-kicker text-fg-subtle">
          Tema
        </span>
        <select
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value || null)}
          className={cn(
            'theme-select min-h-11 rounded-full border border-border-subtle bg-transparent px-3 py-1',
            'text-sm text-fg focus-ring',
            'disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <option value="">Mi nivel</option>
          {VOCAB_ROUTES.map((route) => (
            <option key={route.id} value={route.id}>
              {route.label}
            </option>
          ))}
        </select>
      </label>
      {active ? (
        <p className="m-0 hidden max-w-[36ch] text-center text-caption text-fg-subtle sm:block">
          Ruta guiada: {active.description}
        </p>
      ) : (
        <p className="m-0 hidden max-w-[36ch] text-center text-caption text-fg-subtle sm:block">
          Practica tu nivel recomendado o elige un tema para enfocarte.
        </p>
      )}
    </div>
  )
}
