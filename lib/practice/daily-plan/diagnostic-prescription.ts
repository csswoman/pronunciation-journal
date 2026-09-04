import { getLocalPronunciationAssessments } from '@/lib/pronunciation/assessment/persistence'
import { getTarget } from '@/lib/pronunciation/targets/registry'
import { db } from '@/lib/db'
import { enqueue } from '@/lib/sync/sync-manager'
import type { PrescriptionSession } from '@/lib/pronunciation/assessment/schema'
import type { Sound } from '@/lib/phoneme-practice/types'

const DAY_MS = 86_400_000
const PRESCRIPTION_VALIDITY_MS = 14 * DAY_MS

export interface DiagnosticPrescriptionTarget {
  assessmentId?: string
  session: PrescriptionSession
  sound: Sound | null
  dayIndex: number
  totalSessions?: number
}

/**
 * Consulta la última evaluación diagnóstica de pronunciación del usuario y extrae
 * la sesión prescrita.
 *
 * Prioriza el avance basado en sesiones completadas (`completedSessionIndices`):
 * si el usuario completó la sesión 0, avanza a la 1 sin importar si pasaron 2 horas o 3 días.
 * Si no hay historial de completadas, recurre al avance basado en tiempo calendario (`ageMs / DAY_MS`).
 */
export async function resolveDiagnosticPrescriptionTarget(
  userId: string,
  allSounds: Sound[],
  nowMs: number = Date.now(),
): Promise<DiagnosticPrescriptionTarget | null> {
  try {
    const assessments = await getLocalPronunciationAssessments(userId)
    if (!assessments || assessments.length === 0) return null

    const latest = assessments[0]
    if (!latest?.result) return null

    const completedAt = new Date(latest.completedAt).getTime()
    const ageMs = nowMs - completedAt
    if (isNaN(ageMs) || ageMs < 0 || ageMs > PRESCRIPTION_VALIDITY_MS) {
      return null
    }

    const prescription = (latest.result as {
      prescription?: { sessions?: PrescriptionSession[] }
      completedSessionIndices?: number[]
    }).prescription
    const sessions = prescription?.sessions
    if (!sessions || sessions.length === 0) return null

    const completedIndices = (latest.result as { completedSessionIndices?: number[] }).completedSessionIndices ?? []

    // 1. Avance por logro: buscar el primer índice pendiente
    let dayIndex: number
    const firstPendingIdx = sessions.findIndex((_, idx) => !completedIndices.includes(idx))
    if (firstPendingIdx !== -1 && completedIndices.length > 0) {
      dayIndex = firstPendingIdx
    } else if (completedIndices.length >= sessions.length) {
      // Si completó todas las sesiones, recircula en ciclo de mantenimiento
      dayIndex = completedIndices.length % sessions.length
    } else {
      // Fallback temporal si aún no se ha marcado ninguna sesión
      dayIndex = Math.floor(ageMs / DAY_MS) % sessions.length
    }

    const session = sessions[dayIndex]
    if (!session) return null

    const sound = findSoundForTargetId(session.targetId, allSounds)

    return {
      assessmentId: latest.id,
      session,
      sound,
      dayIndex,
      totalSessions: sessions.length,
    }
  } catch (err) {
    console.warn('[resolveDiagnosticPrescriptionTarget] error loading prescription', err)
    return null
  }
}

/**
 * Marca una sesión de prescripción diagnóstica como completada en el mirror local
 * y encola la actualización para Supabase outbox.
 */
export async function markDiagnosticPrescriptionSessionComplete(
  userId: string,
  assessmentId: string,
  sessionIndex: number,
): Promise<void> {
  try {
    const existing = await db.pronunciationAssessments.get(assessmentId)
    if (!existing || existing.userId !== userId) return

    const currentResult = (existing.result || {}) as {
      completedSessionIndices?: number[]
      [key: string]: unknown
    }

    const completed = new Set(currentResult.completedSessionIndices ?? [])
    completed.add(sessionIndex)

    const updatedResult = {
      ...currentResult,
      completedSessionIndices: Array.from(completed).sort((a, b) => a - b),
    }

    await db.pronunciationAssessments.update(assessmentId, {
      result: updatedResult,
    })

    await enqueue(
      userId,
      'pronunciation_assessments',
      'update',
      { id: assessmentId, result: updatedResult },
      undefined,
      'id',
    )
  } catch (err) {
    console.warn('[markDiagnosticPrescriptionSessionComplete] failed to update progress', err)
  }
}

/**
 * Encuentra un Sound en allSounds que coincida con el target del diagnóstico.
 */
export function findSoundForTargetId(targetId: string, allSounds: Sound[]): Sound | null {
  const lookup = getTarget(targetId)

  // 1. Si es un par de contraste fonético (e.g. ['/iː/', '/ɪ/'] o ['/θ/', '/ð/'])
  if (lookup.ok && lookup.target.contrastPair && lookup.target.contrastPair.length > 0) {
    for (const ipa of lookup.target.contrastPair) {
      const cleanIpa = ipa.replace(/^\/+|\/+$/g, '')
      const match = allSounds.find(
        (s) => s.ipa.replace(/^\/+|\/+$/g, '') === cleanIpa,
      )
      if (match) return match
    }
  }

  // 2. Si el ID contiene directamente la notación fonética
  for (const sound of allSounds) {
    const cleanIpa = sound.ipa.replace(/^\/+|\/+$/g, '')
    if (cleanIpa && targetId.includes(cleanIpa)) {
      return sound
    }
  }

  return null
}
