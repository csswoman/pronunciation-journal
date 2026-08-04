'use client'

// Planned structure:
// <EssentialWordsChrome>
//   <span kicker="Práctica esenciales" />
//   default   — <SrsVault /> + <RouteSettingsPopover />
//   speaking  — exit (X) button only
// </EssentialWordsChrome>

import { SrsVault } from '@/components/practice/srs-vault/SrsVault'
import { RouteSettingsPopover } from './RouteSettingsPopover'
import { X } from '@/components/icons'

interface Props {
  /** true during the recording/speak step, where the task should own the viewport. */
  speaking: boolean
  onExit: () => void
  activeRouteId: string | null
  onRouteChange: (routeId: string | null) => void
  routeDisabled?: boolean
}

export function EssentialWordsChrome({
  speaking, onExit, activeRouteId, onRouteChange, routeDisabled,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-kicker text-fg-muted">Palabras esenciales</span>
      {speaking ? (
        <button
          type="button"
          onClick={onExit}
          aria-label="Salir de la práctica"
          className="flex size-11 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-raised hover:text-fg-muted"
        >
          <X size={16} aria-hidden />
        </button>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <SrsVault />
          <RouteSettingsPopover value={activeRouteId} onChange={onRouteChange} disabled={routeDisabled} />
        </div>
      )}
    </div>
  )
}
