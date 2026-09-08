/**
 * lib/focus/gap-suggestions.ts
 *
 * Analiza el historial del usuario para sugerir 2-4 gaps relevantes para cerrar.
 * Prioriza:
 * 1. Temas de gramática con errores frecuentes o repasos pendientes.
 * 2. Fonemas o contrastes con baja precisión en Sound Lab.
 * 3. Fallback a los patrones más comunes que complican a hispanohablantes (Simple Past, /ɪ/ vs /iː/, etc.).
 */

import { db } from '@/lib/db'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'
import type { SprintGap } from './types'

export interface GapSuggestion extends SprintGap {
  reason: string
  accuracy?: number
}

const DEFAULT_GAPS: GapSuggestion[] = [
  {
    kind: 'grammar',
    targetId: 'grammar:past simple',
    label: 'Pasado simple (verbos regulares e irregulares)',
    level: 'a2',
    reason: 'Común en hispanohablantes: omitir terminación -ed o confundir formas irregulares.',
  },
  {
    kind: 'phoneme',
    targetId: 'vowel:/ɪ/',
    label: 'Vocal corta /ɪ/ vs /iː/ (ship vs sheep)',
    level: 'a2',
    reason: 'Distinción fonética clave que no existe de forma natural en español.',
  },
  {
    kind: 'grammar',
    targetId: 'grammar:present perfect',
    label: 'Presente perfecto vs Pasado simple',
    level: 'b1',
    reason: 'Confusión típica al elegir entre tiempos pasados indefinidos y definidos.',
  },
  {
    kind: 'grammar',
    targetId: 'grammar:prepositions',
    label: 'Preposiciones (in, on, at)',
    level: 'a2',
    reason: 'Uso de preposiciones de tiempo y lugar que difieren fuertemente del español.',
  },
]

/**
 * Obtiene sugerencias personalizadas de gaps basadas en la actividad reciente.
 */
export async function getSuggestedGaps(userId: string): Promise<GapSuggestion[]> {
  try {
    const suggestions: GapSuggestion[] = []

    // 1. Revisar errores recientes en answer_history
    const recentAnswers = await db.attempts
      .where('userId')
      .equals(userId)
      .reverse()
      .limit(60)
      .toArray()

    if (recentAnswers.length > 5) {
      const failedCount = recentAnswers.filter((a) => a.accuracy < 60).length
      if (failedCount > 2) {
        suggestions.push({
          kind: 'grammar',
          targetId: 'grammar:past simple',
          label: 'Pasado simple',
          level: 'a2',
          reason: `Detectados fallos recientes en respuestas prácticas (${failedCount} errores).`,
          accuracy: Math.round(
            recentAnswers.reduce((acc, curr) => acc + curr.accuracy, 0) / recentAnswers.length,
          ),
        })
      }
    }

    // 2. Revisar contrastes débiles en cachedContrastProgress si existen
    const weakContrasts = await db.cachedContrastProgress
      .where('userId')
      .equals(userId)
      .limit(2)
      .toArray()

    for (const c of weakContrasts) {
      suggestions.push({
        kind: 'phoneme',
        targetId: `contrast:${c.contrastId}`,
        label: `Contraste fonético: ${c.contrastId}`,
        level: 'a2',
        reason: 'Contraste con repasos pendientes o baja precisión en Sound Lab.',
      })
    }

    // Completar con defaults si hay menos de 3 sugerencias
    for (const def of DEFAULT_GAPS) {
      if (!suggestions.some((s) => s.targetId === def.targetId)) {
        suggestions.push(def)
      }
      if (suggestions.length >= 4) break
    }

    return suggestions
  } catch {
    return DEFAULT_GAPS
  }
}

/** Devuelve la lista completa de temas disponibles en el catálogo para selección manual. */
export function getAvailableCurriculumGaps(): SprintGap[] {
  return TOPIC_CATALOG.map((topic) => ({
    kind: 'grammar',
    targetId: topic.id,
    label: topic.label,
    level: 'a2',
  }))
}
