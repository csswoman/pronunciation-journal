'use client'

// Planned structure:
// <RouteSettingsPopover>
//   <SettingsTrigger />   — ghost gear icon button, toggles the panel
//   <SettingsPanel />     — role=dialog, wraps <RoutePicker />, portaled to escape clipping ancestors
// </RouteSettingsPopover>

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import { RoutePicker } from './RoutePicker'

interface Props {
  value: string | null
  onChange: (routeId: string | null) => void
  disabled?: boolean
}

export function RouteSettingsPopover({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState({ top: 0, right: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setAnchor({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
  }, [open])

  useEffect(() => {
    if (!open) return

    closeButtonRef.current?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        close()
      }
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn( 'flex size-11 items-center justify-center rounded-full text-fg-subtle', 'transition-colors duration-150 ease-out-quart focus-ring', 'hover:bg-surface-raised hover:text-fg-muted', open && 'bg-surface-raised text-fg-muted', )}
        aria-label="Elegir ruta de práctica"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Settings size={16} aria-hidden />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label="Elegir ruta de práctica"
              className="animate-state-in fixed z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-md border border-border-default bg-surface-raised p-4 shadow-lg"
              style={{ top: anchor.top, right: anchor.right }}
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="m-0 text-label font-semibold text-fg">Ruta de práctica</h2>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="flex size-11 items-center justify-center rounded-full text-fg-subtle transition-colors duration-150 ease-out-quart focus-ring hover:bg-surface-sunken hover:text-fg-muted"
                  aria-label="Cerrar"
                  onClick={close}
                >
                  <X size={14} aria-hidden />
                </button>
              </div>

              <RoutePicker value={value} onChange={onChange} disabled={disabled} />
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
