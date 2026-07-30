'use client'

// Planned structure:
// <SessionHelpPopover>
//   <HelpTrigger />   — ghost "?" icon button, toggles the panel
//   <HelpPanel />     — role=dialog, 4 short explainer rows
// </SessionHelpPopover>

import { useEffect, useId, useRef, useState } from 'react'
import { HelpCircle, X } from '@/components/icons'
import { cn } from '@/lib/cn'

interface HelpRow {
  term: string
  desc: string
}

const ROWS: HelpRow[] = [
  {
    term: 'Nuevas · Aprendiendo · Repaso',
    desc: 'Palabras que ves hoy por primera vez, las que estás fijando y las que toca repasar.',
  },
  {
    term: 'Por qué estas palabras',
    desc: 'Se eligen por tu nivel y por su frecuencia real en inglés.',
  },
  {
    term: 'Por qué vuelven',
    desc: 'Repaso espaciado: reaparecen justo antes de que las olvidarías.',
  },
  {
    term: 'Forma natural al hablar',
    desc: 'La forma relajada de una palabra en el habla natural (por ejemplo, «to» → /tə/).',
  },
]

export function SessionHelpPopover() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

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
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className={cn( 'flex size-11 items-center justify-center rounded-full text-fg-subtle', 'transition-colors duration-150 ease-out-quart focus-ring', 'hover:bg-surface-raised hover:text-fg-muted', open && 'bg-surface-raised text-fg-muted', )}
        aria-label="Cómo funciona esta práctica"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <HelpCircle size={16} aria-hidden />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Cómo funciona esta práctica"
          className={cn( 'absolute right-0 top-full z-30 mt-2 w-72 origin-top-right', 'animate-state-in rounded-md border border-border-default bg-surface-raised p-4 shadow-lg', )}
        >
          <div className="mb-3 flex items-center justify-between">
            <h2 className="m-0 text-label font-semibold text-fg">Cómo funciona</h2>
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

          <dl className="m-0 flex flex-col gap-3">
            {ROWS.map((row) => (
              <div key={row.term} className="flex flex-col gap-0.5">
                <dt className="text-caption font-semibold text-fg">{row.term}</dt>
                <dd className="m-0 text-caption leading-snug text-fg-muted">{row.desc}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </div>
  )
}
