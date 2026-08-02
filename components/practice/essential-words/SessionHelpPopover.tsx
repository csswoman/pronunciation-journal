'use client'

// Planned structure:
// <SessionHelpPopover>
//   <HelpTrigger />   — ghost "?" icon button, toggles the panel
//   <HelpPanel />     — role=dialog, deck stats + 4 short explainer rows
// </SessionHelpPopover>

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle, X } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { EssentialWordsStats } from '@/hooks/useEssentialWordsSession'

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

interface Props {
  stats: EssentialWordsStats
}

export function SessionHelpPopover({ stats }: Props) {
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
        aria-label="Cómo funciona esta práctica"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <HelpCircle size={16} aria-hidden />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-label="Cómo funciona esta práctica"
              className="animate-state-in fixed z-50 w-72 max-w-[calc(100vw-2rem)] origin-top-right rounded-md border border-border-default bg-surface-raised p-4 shadow-lg"
              style={{ top: anchor.top, right: anchor.right }}
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

              <ul aria-label="Resumen de palabras" className="m-0 mb-3 flex list-none flex-wrap items-center gap-x-3 gap-y-1 border-b border-border-subtle p-0 pb-3 text-caption text-fg-muted">
                <li>
                  Palabras <span className="font-medium text-fg">{stats.learned}/{new Intl.NumberFormat('es-ES', { useGrouping: 'always' }).format(stats.totalWords)}</span>
                </li>
                <li>
                  Vencidas <span className="font-medium text-fg">{stats.dueCount}</span>
                </li>
                <li>
                  Cupo diario <span className="font-medium text-fg">{stats.newToday}/{stats.newQuota}</span>
                </li>
              </ul>

              <dl className="m-0 flex flex-col gap-3">
                {ROWS.map((row) => (
                  <div key={row.term} className="flex flex-col gap-0.5">
                    <dt className="text-caption font-semibold text-fg">{row.term}</dt>
                    <dd className="m-0 text-caption leading-snug text-fg-muted">{row.desc}</dd>
                  </div>
                ))}
              </dl>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}
