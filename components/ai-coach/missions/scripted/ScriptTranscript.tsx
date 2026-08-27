'use client'

// Planned structure:
// <ScriptTranscript>
//   <TranscriptLine />  — burbuja de solo lectura por linea recorrida

import { cn } from '@/lib/cn'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  script: ScriptLine[]
  /** Indice de la linea en curso: el historial llega hasta la anterior. */
  currentIndex: number
}

/**
 * Historial del dialogo en formato chat, sin entrada de texto.
 *
 * La mision con guion se practica hablando, pero el guion sigue siendo una
 * conversacion: leerla turno a turno es lo que da contexto a la linea actual.
 * Por eso esto es deliberadamente inerte — ni input, ni botones.
 */
export function ScriptTranscript({ script, currentIndex }: Props) {
  const past = script.slice(0, Math.max(0, currentIndex))
  if (past.length === 0) return null

  return (
    <ol
      aria-label="Diálogo hasta ahora"
      className="flex flex-col gap-2 list-none p-0 m-0"
    >
      {past.map((line) => {
        const isCoach = line.speaker === 'coach'
        return (
          <li
            key={line.id}
            className={cn('flex flex-col gap-0.5', isCoach ? 'items-start' : 'items-end')}
          >
            <span className="text-xxs font-medium uppercase tracking-wider text-fg-subtle">
              {isCoach ? 'Coach' : 'Tú'}
            </span>
            <p
              className={cn(
                'max-w-[85%] rounded-xl px-3 py-2 text-caption',
                isCoach
                  ? 'bg-surface-raised text-fg-muted'
                  : 'bg-primary-soft text-fg',
              )}
            >
              {line.text}
            </p>
          </li>
        )
      })}
    </ol>
  )
}
