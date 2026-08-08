'use client'



// Planned structure:

// <SessionReadyRouteHint>

//   <details> summary + <RoutePicker />

// </SessionReadyRouteHint>



import { ChevronDown } from '@/components/icons'

import { cn } from '@/lib/cn'

import { getRoute } from '@/lib/essential-words/routes'

import { RoutePicker } from './RoutePicker'



interface Props {

  activeRouteId: string | null

  onRouteChange: (routeId: string | null) => void

}



export function SessionReadyRouteHint({ activeRouteId, onRouteChange }: Props) {

  const activeRoute = getRoute(activeRouteId)

  const summaryLabel = activeRoute ? activeRoute.label : 'Sesión recomendada'



  return (

    <details className="group w-full">

      <summary

        className={cn(

          'flex cursor-pointer list-none items-center justify-center gap-1 rounded-md px-3 py-2',

          'text-caption text-fg-muted transition-colors hover:text-fg-subtle focus-ring',

          '[&::-webkit-details-marker]:hidden',

        )}

      >

        <span>{summaryLabel}</span>

        <ChevronDown

          size={14}

          aria-hidden

          className="transition-transform duration-150 ease-out-quart group-open:rotate-180"

        />

      </summary>

      <div className="mt-3 w-full">

        <RoutePicker value={activeRouteId} onChange={onRouteChange} />

      </div>

    </details>

  )

}

