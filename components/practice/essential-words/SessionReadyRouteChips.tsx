'use client'

// Planned structure:
// <SessionReadyRouteChips>
//   collapse toggle (current route)
//   animated panel: recommended + level grids
// </SessionReadyRouteChips>

import { useState } from 'react'
import { ChevronDown } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getRoute, groupRoutesByLevel, routeShortLabel } from '@/lib/essential-words/routes'

interface Props {
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  disabled?: boolean
}

export function SessionReadyRouteChips({ activeRouteId, onRouteChange, disabled = false }: Props) {
  const groups = groupRoutesByLevel()
  const recommended = activeRouteId === null
  const activeRoute = getRoute(activeRouteId)
  const summaryLabel = activeRoute ? activeRoute.label : 'Sesión recomendada'
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="flex w-full flex-col gap-layout-stack-tight" aria-label="Ruta de vocabulario">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls="session-ready-route-panel"
        disabled={disabled}
        onClick={() => setExpanded((open) => !open)}
        className={cn(
          'flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-1 py-1.5',
          'text-left transition-colors duration-150 ease-out-quart focus-ring',
          'text-fg-muted hover:text-fg',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <span className="min-w-0 truncate text-caption">
          <span className="text-fg-subtle">Ruta · </span>
          <span className="font-semibold text-fg">{summaryLabel}</span>
        </span>
        <ChevronDown
          size={16}
          aria-hidden
          className={cn(
            'shrink-0 transition-transform duration-200 ease-out-quart',
            'motion-reduce:transition-none',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div
        id="session-ready-route-panel"
        className={cn(
          'grid transition-[grid-template-rows,opacity] duration-200 ease-out-quart',
          'motion-reduce:transition-none',
          expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
        inert={!expanded ? true : undefined}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex w-full flex-col gap-layout-stack pt-1">
            <button
              type="button"
              aria-pressed={recommended}
              disabled={disabled}
              aria-label="Sesión recomendada"
              tabIndex={expanded ? undefined : -1}
              onClick={() => onRouteChange(null)}
              className={cn(
                'flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 py-2.5',
                'text-left transition-[color,background-color,border-color,transform] duration-150 ease-out-quart focus-ring',
                'active:scale-[0.99] motion-reduce:active:scale-100',
                'disabled:cursor-not-allowed disabled:opacity-60',
                recommended
                  ? 'border-primary bg-primary-soft text-primary'
                  : 'border-border-subtle bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg',
              )}
            >
              <span className="font-label">Sesión recomendada</span>
              <span
                className={cn(
                  'shrink-0 text-caption',
                  recommended ? 'text-primary/80' : 'text-fg-subtle',
                )}
                aria-hidden
              >
                Por frecuencia
              </span>
            </button>

            <div className="flex w-full flex-col gap-layout-stack">
              {groups.map((group) => (
                <div
                  key={group.level}
                  role="group"
                  aria-label={`Nivel ${group.level}`}
                  className="flex w-full flex-col gap-1.5"
                >
                  <span className="font-kicker text-fg-muted">Nivel {group.level}</span>
                  <div
                    className="grid w-full gap-1.5"
                    style={{
                      gridTemplateColumns: `repeat(${group.routes.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {group.routes.map((route) => {
                      const selected = activeRouteId === route.id
                      return (
                        <button
                          key={route.id}
                          type="button"
                          aria-pressed={selected}
                          disabled={disabled}
                          aria-label={route.label}
                          tabIndex={expanded ? undefined : -1}
                          onClick={() => onRouteChange(route.id)}
                          className={cn(
                            'inline-flex min-h-10 w-full items-center justify-center rounded-md px-2 py-2',
                            'text-caption font-semibold transition-[color,background-color,transform]',
                            'duration-150 ease-out-quart focus-ring active:scale-[0.97]',
                            'motion-reduce:transition-colors motion-reduce:active:scale-100',
                            'disabled:cursor-not-allowed disabled:opacity-60',
                            selected
                              ? 'bg-primary-soft text-primary'
                              : 'bg-surface-sunken text-fg-muted hover:bg-surface-raised hover:text-fg',
                          )}
                        >
                          {routeShortLabel(route)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
