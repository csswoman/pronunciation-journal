'use client'

// Planned structure:
// <SessionReadyRouteChips>
//   recommended chip + route chips (visible, not buried details)
// </SessionReadyRouteChips>

import { cn } from '@/lib/cn'
import { VOCAB_ROUTES } from '@/lib/essential-words/routes'

interface Props {
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
}

export function SessionReadyRouteChips({ activeRouteId, onRouteChange }: Props) {
  return (
    <div role="group" aria-label="Ruta de vocabulario" className="flex flex-wrap gap-2">
      <button
        type="button"
        aria-pressed={activeRouteId === null}
        onClick={() => onRouteChange(null)}
        className={cn(
          'rounded-full px-3 py-1.5 text-caption font-semibold transition-colors focus-ring',
          activeRouteId === null
            ? 'bg-primary-soft text-primary'
            : 'bg-surface-sunken text-fg-muted hover:text-fg',
        )}
      >
        Sesión recomendada
      </button>
      {VOCAB_ROUTES.map((route) => {
        const selected = activeRouteId === route.id
        return (
          <button
            key={route.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onRouteChange(route.id)}
            className={cn(
              'rounded-full px-3 py-1.5 text-caption font-semibold transition-colors focus-ring',
              selected
                ? 'bg-primary-soft text-primary'
                : 'bg-surface-sunken text-fg-muted hover:text-fg',
            )}
          >
            {route.label}
          </button>
        )
      })}
    </div>
  )
}
