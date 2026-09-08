/**
 * lib/focus/sprint-lifecycle.ts
 *
 * Lógica de ciclo de vida de un sprint de foco:
 * - Verificar si el sprint activo ha expirado
 * - Días restantes
 * - Renovar un sprint completado/expirado
 *
 * No maneja scheduling ni polling — la verificación se llama
 * desde el cliente al montar la vista del sprint.
 */

import { getActiveSprint, updateSprintStatus, createSprint } from './queries'
import type { FocusSprint, SprintGap } from './types'

/** Calcula los días restantes del sprint (puede ser 0 si ya expiró). */
export function daysRemaining(sprint: FocusSprint): number {
  const msLeft = Date.parse(sprint.endsAt) - Date.now()
  return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
}

/** Porcentaje de tiempo transcurrido del sprint (0-100). */
export function sprintProgressPct(sprint: FocusSprint): number {
  const total = Date.parse(sprint.endsAt) - Date.parse(sprint.startsAt)
  const elapsed = Date.now() - Date.parse(sprint.startsAt)
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
}

/** True si el sprint ha superado su fecha de fin. */
export function isExpired(sprint: FocusSprint): boolean {
  return Date.now() > Date.parse(sprint.endsAt)
}

/**
 * Verifica si el sprint activo ha expirado y lo marca como tal.
 * Llamar al montar FocusHome para mantener el estado consistente.
 * Devuelve el sprint actualizado, o undefined si no había sprint activo.
 */
export async function checkAndExpireSprint(userId: string): Promise<FocusSprint | undefined> {
  const sprint = await getActiveSprint(userId)
  if (!sprint) return undefined

  if (isExpired(sprint)) {
    await updateSprintStatus(sprint.id, userId, 'expired')
    return { ...sprint, status: 'expired' }
  }

  return sprint
}

/**
 * Completa el sprint activo del usuario.
 * Se usa cuando el usuario decide cerrarlo antes de los 7 días.
 */
export async function completeSprint(userId: string): Promise<void> {
  const sprint = await getActiveSprint(userId)
  if (sprint) {
    await updateSprintStatus(sprint.id, userId, 'completed')
  }
}

/**
 * Renueva el sprint con los mismos gaps pero duración nueva.
 * Primero expira/completa el anterior si sigue activo.
 */
export async function renewSprint(
  userId: string,
  gaps: SprintGap[],
  durationDays = 7,
): Promise<FocusSprint> {
  const existing = await getActiveSprint(userId)
  if (existing) {
    await updateSprintStatus(existing.id, userId, 'completed')
  }
  return createSprint(userId, gaps, durationDays)
}
