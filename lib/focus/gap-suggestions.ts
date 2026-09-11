/**
 * lib/focus/gap-suggestions.ts
 *
 * Sugiere gaps para cerrar, con la evidencia que los justifica.
 *
 * Prioriza:
 * 1. Temas de gramática con precisión real baja en `srsRatingEvents`.
 * 2. Contrastes fonéticos ordenados por mastery ascendente.
 * 3. Fallback a los patrones que más complican a hispanohablantes.
 *
 * Regla: cada sugerencia declara de dónde sale (`source`). La UI nunca presenta
 * un default como si fuera personalizado.
 */

import Dexie from 'dexie'
import { db } from '@/lib/db'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'
import { topicDisplayLabel } from '@/lib/practice/topic-labels'
import { getTopicMetadata } from './topic-metadata'
import { aggregateTopicEvidence, type TopicEvidence } from './gap-evidence'
import type { SprintGap } from './types'

/** Origen de una sugerencia. La UI agrupa y rotula distinto según esto. */
export type SuggestionSource = 'history' | 'pronunciation' | 'default'

export interface GapSuggestion extends SprintGap {
  reason: string
  source: SuggestionSource
  accuracy?: number
  /** Precisión por segmento temporal para el sparkline. */
  trend?: (number | null)[]
  /** Intentos totales que respaldan la precisión. */
  sampleCount?: number
}

/** Cuántas sugerencias mostrar como máximo. */
const MAX_SUGGESTIONS = 4

/** Precisión bajo la cual un tema entra como sugerencia. */
const WEAK_ACCURACY = 70

const DEFAULT_GAPS: GapSuggestion[] = [
  {
    kind: 'grammar',
    targetId: 'grammar:past simple',
    label: 'Pasado simple',
    level: 'a2',
    source: 'default',
    reason: 'Muy común en hispanohablantes: omitir la terminación -ed o confundir las formas irregulares.',
  },
  {
    kind: 'phoneme',
    targetId: 'vowel:/ɪ/',
    label: 'Vocal corta /ɪ/ vs /iː/ (ship vs sheep)',
    level: 'a2',
    source: 'default',
    reason: 'Distinción de sonido que no existe en español, así que el oído no la separa solo.',
  },
  {
    kind: 'grammar',
    targetId: 'grammar:present perfect',
    label: 'Presente perfecto vs Pasado simple',
    level: 'b1',
    source: 'default',
    reason: 'Elegir entre los dos pasados es la duda más repetida al pasar de A2 a B1.',
  },
  {
    kind: 'grammar',
    targetId: 'grammar:prepositions',
    label: 'Preposiciones (in, on, at)',
    level: 'a2',
    source: 'default',
    reason: 'No se traducen una a una desde el español, así que se memorizan por uso.',
  },
]

/** Redacta el motivo citando los números reales del usuario. */
function reasonFromEvidence(evidence: TopicEvidence, label: string): string {
  const days = Math.max(
    1,
    Math.round((Date.now() - new Date(evidence.lastAt).getTime()) / (24 * 60 * 60 * 1000)),
  )
  const whenText = days <= 1 ? 'hoy' : `hace ${days} días`
  return `Fallaste ${evidence.failed} de ${evidence.total} intentos en ${label}. El último, ${whenText}.`
}

/** Convierte una fila de evidencia en sugerencia, si el tema es del catálogo. */
function suggestionFromEvidence(evidence: TopicEvidence): GapSuggestion | null {
  const label = topicDisplayLabel(evidence.topicId)
  if (!label) return null

  const meta = getTopicMetadata(evidence.topicId)
  return {
    kind: meta.kind,
    targetId: evidence.topicId,
    label,
    level: meta.level,
    source: 'history',
    reason: reasonFromEvidence(evidence, label),
    accuracy: evidence.accuracy,
    trend: evidence.trend,
    sampleCount: evidence.total,
  }
}

/**
 * Sugerencias personalizadas basadas en la actividad reciente.
 *
 * Nunca lanza: sin historial o con Dexie caído devuelve los defaults, marcados
 * como tales para que la UI no los presente como personalizados.
 */
export async function getSuggestedGaps(userId: string): Promise<GapSuggestion[]> {
  try {
    const suggestions: GapSuggestion[] = []

    // 1. Precisión real por tema desde las calificaciones SRS.
    const ratingEvents = await db.srsRatingEvents
      .where('[userId+entityType+topic]')
      .between([userId, 'topic_srs', Dexie.minKey], [userId, 'topic_srs', Dexie.maxKey])
      .toArray()

    const evidence = aggregateTopicEvidence(ratingEvents)
    for (const row of evidence) {
      if (row.accuracy >= WEAK_ACCURACY) continue
      const suggestion = suggestionFromEvidence(row)
      if (suggestion) suggestions.push(suggestion)
      if (suggestions.length >= MAX_SUGGESTIONS) break
    }

    // 2. Contrastes fonéticos, del menos dominado hacia arriba.
    if (suggestions.length < MAX_SUGGESTIONS) {
      const contrasts = await db.cachedContrastProgress
        .where('userId')
        .equals(userId)
        .toArray()

      const weakest = contrasts
        .filter((c) => c.totalAttempts > 0)
        .sort((a, b) => a.masteryPct - b.masteryPct)
        .slice(0, 2)

      for (const contrast of weakest) {
        const wrong = contrast.totalAttempts - contrast.correctAnswers
        suggestions.push({
          kind: 'phoneme',
          targetId: `contrast:${contrast.contrastId}`,
          label: `Contraste ${contrast.contrastId}`,
          level: 'a2',
          source: 'pronunciation',
          reason: `Lo fallaste ${wrong} de ${contrast.totalAttempts} veces en el laboratorio de sonidos.`,
          accuracy: Math.round(contrast.masteryPct),
          sampleCount: contrast.totalAttempts,
        })
      }
    }

    // 3. Completar con defaults, sin duplicar lo ya sugerido.
    for (const def of DEFAULT_GAPS) {
      if (suggestions.length >= MAX_SUGGESTIONS) break
      if (!suggestions.some((s) => s.targetId === def.targetId)) {
        suggestions.push(def)
      }
    }

    return suggestions.slice(0, MAX_SUGGESTIONS)
  } catch {
    return DEFAULT_GAPS
  }
}

/**
 * Catálogo completo para selección manual, con el nivel CEFR real de cada tema
 * en vez de un 'a2' uniforme: ese valor alimenta el prompt de generación.
 */
export function getAvailableCurriculumGaps(): SprintGap[] {
  return TOPIC_CATALOG.map((topic) => {
    const meta = getTopicMetadata(topic.id)
    return {
      kind: meta.kind,
      targetId: topic.id,
      label: topic.label,
      level: meta.level,
    }
  })
}
