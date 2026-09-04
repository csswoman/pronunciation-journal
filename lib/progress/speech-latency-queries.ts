import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  averageSpeechLatencyMs,
  latencyTrend,
  type LatencyTrend,
  type SpeechAnswerRow,
} from './speech-metrics'

export interface SpeechLatencyData {
  averageMs: number | null
  trend: LatencyTrend | null
}

const ROLLING_WINDOW_DAYS = 30

/**
 * Consulta los intentos orales del usuario en los últimos 30 días (`spoken_production`,
 * `speak_word`, `cs_shadow_phrase`) y calcula la latencia media y la tendencia de fluidez.
 */
export async function getSpeechLatencyData(
  userId: string,
  nowMs: number = Date.now(),
): Promise<SpeechLatencyData> {
  const supabase = await createSupabaseServerClient()
  const since = new Date(nowMs - ROLLING_WINDOW_DAYS * 86_400_000).toISOString()

  const { data, error } = await supabase
    .from('answer_history')
    .select('exercise_type_id, time_ms, is_correct, answered_at, exercise_payload')
    .eq('user_id', userId)
    .in('exercise_type_id', [16, 17, 23]) // 16: spoken_production, 17: speak_word, 23: cs_shadow_phrase
    .gte('answered_at', since)
    .order('answered_at', { ascending: false })
    .limit(500)

  if (error || !data || data.length === 0) {
    return { averageMs: null, trend: null }
  }

  const rows: SpeechAnswerRow[] = data.map((r) => {
    const slug =
      r.exercise_type_id === 16
        ? 'spoken_production'
        : r.exercise_type_id === 17
        ? 'speak_word'
        : 'cs_shadow_phrase'
    const payload = r.exercise_payload as { constraintId?: unknown } | null
    return {
      slug,
      timeMs: typeof r.time_ms === 'number' ? r.time_ms : null,
      constraintId: typeof payload?.constraintId === 'string' ? payload.constraintId : null,
      isCorrect: Boolean(r.is_correct),
      answeredAt: String(r.answered_at),
    }
  })

  return {
    averageMs: averageSpeechLatencyMs(rows),
    trend: latencyTrend(rows, nowMs),
  }
}
