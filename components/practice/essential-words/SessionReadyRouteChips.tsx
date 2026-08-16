'use client'

import { ChevronDown } from '@/components/icons'
import { groupRoutesByLevel } from '@/lib/essential-words/routes'

interface Props {
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  disabled?: boolean
}

export function SessionReadyRouteChips({ activeRouteId, onRouteChange, disabled = false }: Props) {
  const groups = groupRoutesByLevel()

  return (
    <div className="group relative w-full" aria-label="Ruta de vocabulario">
      <label htmlFor="session-ready-route" className="sr-only">
        Ruta
      </label>
      <select
        id="session-ready-route"
        value={activeRouteId ?? ''}
        disabled={disabled}
        onChange={(event) => onRouteChange(event.target.value || null)}
        className="min-h-11 w-full appearance-none rounded-md border border-border-default bg-surface-sunken py-2 pl-3 pr-10 text-label font-semibold text-fg transition-[color,background-color,border-color,box-shadow] duration-150 ease-out-quart hover:border-border-strong hover:bg-surface-raised focus:border-primary focus:bg-surface-raised focus:shadow-sm focus-ring disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">Por frecuencia</option>
        {groups.map((group) => (
          <optgroup key={group.level} label={`Nivel ${group.level}`}>
            {group.routes.map((route) => (
              <option key={route.id} value={route.id}>
                {route.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span
        className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-fg-muted transition-colors duration-150 ease-out-quart group-hover:text-fg group-focus-within:text-primary"
        aria-hidden
      >
        <ChevronDown size={16} />
      </span>
    </div>
  )
}
