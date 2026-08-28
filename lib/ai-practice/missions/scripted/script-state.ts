import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'
import type { ScriptLine } from '../types'

export type ScriptStatus = 'in_progress' | 'completed' | 'cancelled'

export interface ScriptState {
  missionId: string
  script: ScriptLine[]
  currentIndex: number
  /**
   * Mejor intento puntuado por línea. Se practica, no se examina: premiar la
   * insistencia es lo pedagógicamente correcto, así que el score final usa
   * esto y no el primer intento.
   */
  bestByLine: Map<string, SpokenAttempt>
  /** Todos los intentos, incluidos los peores: son evidencia para el SRS. */
  allAttempts: SpokenAttempt[]
  status: ScriptStatus
}

export function createScriptState(missionId: string, script: ScriptLine[]): ScriptState {
  return {
    missionId,
    script,
    currentIndex: 0,
    bestByLine: new Map(),
    allAttempts: [],
    status: 'in_progress',
  }
}

export function currentLine(state: ScriptState): ScriptLine | null {
  return state.script[state.currentIndex] ?? null
}

/**
 * Registra un intento. Solo los `scored` compiten por ser el mejor — un
 * fallo de STT o un micrófono ausente no es un 0, es ausencia de dato.
 */
export function recordAttempt(state: ScriptState, attempt: SpokenAttempt): ScriptState {
  const line = currentLine(state)
  if (!line) return state

  const allAttempts = [...state.allAttempts, attempt]
  if (attempt.outcome !== 'scored') {
    return { ...state, allAttempts }
  }

  const bestByLine = new Map(state.bestByLine)
  const previous = bestByLine.get(line.id)
  if (!previous || attempt.overallScore > previous.overallScore) {
    bestByLine.set(line.id, attempt)
  }

  return { ...state, allAttempts, bestByLine }
}

export function advanceLine(state: ScriptState): ScriptState {
  const nextIndex = state.currentIndex + 1
  if (nextIndex >= state.script.length) {
    return { ...state, currentIndex: state.script.length, status: 'completed' }
  }
  return { ...state, currentIndex: nextIndex }
}

export function cancelScript(state: ScriptState): ScriptState {
  return { ...state, status: 'cancelled' }
}
