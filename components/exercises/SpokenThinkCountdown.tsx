'use client'

// Planned structure:
// <SpokenThinkCountdown>
//   <CountdownRing />
//   <ThinkCopy />
//   <SpeakNowPill />
//   <SkipLink />
// </SpokenThinkCountdown>

import { useEffect, useRef, useState } from 'react'
import { Mic } from '@/components/icons'
import { cn } from '@/lib/cn'

const RING_RADIUS = 70
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

interface Props {
  /** Segundos de preparación antes de abrir el micrófono. */
  seconds: number
  /** Se llama al llegar a cero o al pulsar "Hablar ya". */
  onDone: () => void
  onSkip?: () => void
}

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  // El anillo se vacía en cada tick; la transición lineal de 1 s lo hace fluido.
  const offset = RING_CIRCUMFERENCE * (1 - remaining / total)
  return (
    <div className="relative flex size-40 items-center justify-center">
      <svg viewBox="0 0 160 160" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
        <circle cx="80" cy="80" r={RING_RADIUS} fill="none" strokeWidth="9" className="stroke-border" />
        <circle
          cx="80"
          cy="80"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          // Valor calculado en runtime: progreso de la cuenta atrás.
          style={{ strokeDashoffset: offset }}
          className="stroke-primary transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none"
        />
      </svg>
      <span className="font-display text-display font-bold tabular-nums text-fg">{remaining}</span>
    </div>
  )
}

export function SpokenThinkCountdown({ seconds, onDone, onSkip }: Props) {
  const [remaining, setRemaining] = useState(seconds)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (remaining <= 0) {
      onDoneRef.current()
      return
    }
    const id = window.setTimeout(() => setRemaining((r) => r - 1), 1000)
    return () => window.clearTimeout(id)
  }, [remaining])

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex w-full flex-col items-center gap-3 rounded-3xl border border-border bg-surface-sunken px-4 py-8 text-center">
        <CountdownRing remaining={remaining} total={seconds} />
        <div className="flex flex-col items-center gap-0.5">
          <p className="m-0 text-body-md font-bold text-fg" role="status" aria-live="polite">
            Piensa tu respuesta…
          </p>
          <p className="m-0 text-body-sm text-fg-muted">
            El micrófono se abre solo cuando llegue a cero
          </p>
        </div>
        <button
          type="button"
          onClick={onDone}
          className={cn(
            'mt-1 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 border-border',
            'bg-surface px-5 text-body-md font-semibold text-fg transition-colors hover:bg-surface-raised focus-ring',
          )}
        >
          <Mic size={18} />
          Hablar ya
        </button>
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="min-h-11 cursor-pointer rounded-md border-none bg-transparent px-1 text-body-md font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg focus-ring"
        >
          Omitir este ejercicio
        </button>
      )}
    </div>
  )
}
