/**
 * lib/focus/gap-evidence.ts
 *
 * Agregación pura del historial del usuario en evidencia por tema.
 *
 * Pura a propósito: recibe los eventos ya leídos, así que se testea sin Dexie
 * y sirve igual si algún día los datos llegan del servidor. Es el mismo patrón
 * que `aggregateTopicRatings` en lib/ai-practice/srs-weak-topics.ts.
 *
 * Por qué existe: la versión anterior de las sugerencias leía `db.attempts`,
 * que guarda intentos de pronunciación por palabra (word, transcript,
 * accuracy) y no tiene ningún campo de tema gramatical. Recomendar "pasado
 * simple" desde esos datos era una inferencia que los datos no respaldaban.
 * Las calificaciones por tema viven en `srsRatingEvents` con entityType
 * 'topic_srs'.
 */

import type { SRSRatingEventRecord } from '@/lib/db'

/** Calificaciones SM-2 en este umbral o por debajo cuentan como fallo. */
const FAILING_GRADE = 2

/** Ventana de análisis: más atrás ya no describe el estado actual del usuario. */
export const EVIDENCE_WINDOW_DAYS = 30

/** Bajo este número de muestras la tasa de error es ruido, no señal. */
export const MIN_SAMPLES = 3

/** Número de segmentos del sparkline de tendencia. */
const TREND_BUCKETS = 6

export type TopicEvidence = {
  topicId: string
  /** Intentos totales dentro de la ventana. */
  total: number
  /** Intentos fallados dentro de la ventana. */
  failed: number
  /** Precisión 0-100 en la ventana. */
  accuracy: number
  /** ISO del intento más reciente. */
  lastAt: string
  /**
   * Precisión por segmento temporal, del más antiguo al más reciente.
   * `null` en un segmento sin intentos: el sparkline lo dibuja como hueco en
   * vez de fingir un cero que el usuario nunca produjo.
   */
  trend: (number | null)[]
}

/**
 * Agrega eventos de topic_srs en evidencia por tema, ordenada por precisión
 * ascendente (lo más débil primero).
 *
 * Los temas con menos de MIN_SAMPLES intentos se descartan: mostrar "0% de
 * precisión" tras un solo fallo sería una afirmación que el dato no sostiene.
 */
export function aggregateTopicEvidence(
  events: readonly SRSRatingEventRecord[],
  now: number = Date.now(),
): TopicEvidence[] {
  const windowMs = EVIDENCE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const cutoff = now - windowMs
  const bucketMs = windowMs / TREND_BUCKETS

  type Acc = {
    total: number
    failed: number
    lastAt: number
    buckets: { total: number; correct: number }[]
  }
  const byTopic = new Map<string, Acc>()

  for (const event of events) {
    if (event.entityType !== 'topic_srs') continue
    const topicId = event.topic
    if (!topicId) continue

    const at = new Date(event.occurredAt).getTime()
    if (!Number.isFinite(at) || at < cutoff || at > now) continue

    const entry = byTopic.get(topicId) ?? {
      total: 0,
      failed: 0,
      lastAt: 0,
      buckets: Array.from({ length: TREND_BUCKETS }, () => ({ total: 0, correct: 0 })),
    }

    const passed = event.grade > FAILING_GRADE
    entry.total += 1
    if (!passed) entry.failed += 1
    entry.lastAt = Math.max(entry.lastAt, at)

    // El último segmento incluye "ahora", que caería fuera del índice.
    const index = Math.min(TREND_BUCKETS - 1, Math.floor((at - cutoff) / bucketMs))
    entry.buckets[index].total += 1
    if (passed) entry.buckets[index].correct += 1

    byTopic.set(topicId, entry)
  }

  const rows: TopicEvidence[] = []
  for (const [topicId, acc] of byTopic) {
    if (acc.total < MIN_SAMPLES) continue
    rows.push({
      topicId,
      total: acc.total,
      failed: acc.failed,
      accuracy: Math.round(((acc.total - acc.failed) / acc.total) * 100),
      lastAt: new Date(acc.lastAt).toISOString(),
      trend: acc.buckets.map((b) => (b.total === 0 ? null : Math.round((b.correct / b.total) * 100))),
    })
  }

  return rows.sort((a, b) => a.accuracy - b.accuracy || b.total - a.total)
}

/**
 * Dirección de la tendencia comparando el primer y el último segmento con
 * datos. Devuelve null cuando no hay dos puntos que comparar, para que la UI
 * omita la afirmación en vez de inventar una.
 */
export function trendDirection(trend: (number | null)[]): 'up' | 'down' | 'flat' | null {
  const points = trend.filter((v): v is number => v !== null)
  if (points.length < 2) return null
  const delta = points[points.length - 1] - points[0]
  if (delta >= 10) return 'up'
  if (delta <= -10) return 'down'
  return 'flat'
}
