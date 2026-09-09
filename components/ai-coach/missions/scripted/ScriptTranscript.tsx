'use client'

// Planned structure:
// <ScriptTranscript>
//   <TranscriptLine />  — una burbuja por línea ya recorrida

import { TranscriptLine } from './TranscriptLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  script: ScriptLine[]
  /** Indice de la linea en curso: el historial llega hasta la anterior. */
  currentIndex: number
  missionId?: string
}

/**
 * Historial del dialogo en formato chat, sin entrada de texto.
 *
 * La mision con guion se practica hablando, pero el guion sigue siendo una
 * conversacion: leerla turno a turno es lo que da contexto a la linea actual.
 * No hay input ni avance aqui — la unica accion es volver a oir una linea.
 */
export function ScriptTranscript({ script, currentIndex, missionId }: Props) {
  const past = script.slice(0, Math.max(0, currentIndex))
  if (past.length === 0) return null

  return (
    <ol
      aria-label="Diálogo hasta ahora"
      className="flex flex-col gap-3.5 list-none p-0 m-0"
    >
      {past.map((line) => (
        <TranscriptLine key={line.id} line={line} missionId={missionId} />
      ))}
    </ol>
  )
}
