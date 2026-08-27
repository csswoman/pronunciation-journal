import type { ComponentType } from 'react'
import type { MissionMode, OralMission } from './types'

export interface MissionRunnerEntry {
  mode: MissionMode
  /** Etiqueta en español para la biblioteca de misiones. */
  label: string
  /** Carga diferida del componente runner. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  load: () => Promise<{ default: ComponentType<{ mission: any }> }>
}

/**
 * Registry de runners por modo.
 *
 * `Record<MissionMode, ...>` obliga a que añadir un modo nuevo sin su runner
 * sea un error de compilación, en vez de un `switch` que se olvida un caso.
 */
export const MISSION_RUNNERS: Record<MissionMode, MissionRunnerEntry> = {
  conversational: {
    mode: 'conversational',
    label: 'Conversación libre',
    load: () => import('@/components/ai-coach/missions/MissionRunner'),
  },
  scripted: {
    mode: 'scripted',
    label: 'Diálogo con guión',
    load: () => import('@/components/ai-coach/missions/scripted/ScriptedMissionRunner'),
  },
}

export function getRunnerFor(mode: MissionMode): MissionRunnerEntry {
  return MISSION_RUNNERS[mode]
}
