import type { ScriptLine } from '@/lib/ai-practice/missions/types'

export type ModelAudioSource =
  | { kind: 'recorded'; path: string; durationMs?: number }
  | { kind: 'synthesized'; text: string }

/**
 * Decide cómo suena una línea del coach.
 *
 * Los guiones autorados traen audio de alta calidad pregenerado; los
 * generados por Gemini caen en `speechSynthesis`. El componente que reproduce
 * no debe conocer la diferencia — mismo patrón que `ipa-audio.ts`.
 */
export function resolveModelAudio(line: ScriptLine): ModelAudioSource {
  if (line.modelAudio) {
    return {
      kind: 'recorded',
      path: line.modelAudio.path,
      durationMs: line.modelAudio.durationMs,
    }
  }
  return { kind: 'synthesized', text: line.text }
}
