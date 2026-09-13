'use client'

import { useMemo } from 'react'
import { groupRoutesByLevel } from '@/lib/essential-words/routes'
import { SelectMenu, type SelectMenuGroup } from '@/components/ui/SelectMenu'

interface Props {
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  disabled?: boolean
}

export function SessionReadyRouteChips({ activeRouteId, onRouteChange, disabled = false }: Props) {
  const routeGroups = useMemo<SelectMenuGroup<string>[]>(() => {
    const rawGroups = groupRoutesByLevel()
    return [
      {
        label: 'Recomendado',
        options: [
          {
            value: '',
            label: 'Por frecuencia',
            description: 'Aprende en el orden natural del Core 1000',
          },
        ],
      },
      ...rawGroups.map((g) => ({
        label: `Nivel ${g.level}`,
        options: g.routes.map((r) => ({
          value: r.id,
          label: r.label,
          description: r.description,
          badge: g.level,
        })),
      })),
    ]
  }, [])

  return (
    <div className="w-full">
      <SelectMenu
        id="session-ready-route"
        value={activeRouteId ?? ''}
        onChange={(val) => onRouteChange(val || null)}
        groups={routeGroups}
        disabled={disabled}
        aria-label="Ruta"
        placeholder="Por frecuencia"
      />
    </div>
  )
}
