/**
 * When the daily plan offers a multi-turn oral mission.
 *
 * Previously missions were an optional candidate the selector could drop
 * entirely, so a learner whose core problem is freezing mid-conversation
 * could go weeks without ever holding one. A fixed cadence guarantees the
 * rehearsal without making every session long.
 */

/** Monday, Wednesday, Friday (JS getDay(): Sunday = 0). */
export const MISSION_DAYS_OF_WEEK: readonly number[] = [1, 3, 5]

export function shouldOfferMission(
  dayOfWeek: number,
  hasSpeechRecognition: boolean,
): boolean {
  if (!hasSpeechRecognition) return false
  return MISSION_DAYS_OF_WEEK.includes(dayOfWeek)
}

/**
 * Martes y jueves, alternando con los días de conversación libre (L/M/V).
 * Repartirlos evita que una misma sesión traiga dos ejercicios orales largos.
 */
export const SCRIPTED_MISSION_DAYS: readonly number[] = [2, 4]

export function shouldOfferScriptedMission(
  dayOfWeek: number,
  hasSpeechRecognition: boolean,
): boolean {
  if (!hasSpeechRecognition) return false
  return SCRIPTED_MISSION_DAYS.includes(dayOfWeek)
}

export type RotatingSlotType = 'mission' | 'reader' | 'sentence_builder' | 'review'

/**
 * Rota el 5º paso de la diaria entre misión, reader, constructor/habla conectada y repaso,
 * garantizando variedad a lo largo de la semana sin que dos días se sientan idénticos.
 */
export function getRotatingSlotKind(dayOfWeek: number): RotatingSlotType {
  // Lunes (1), Miércoles (3), Viernes (5): Misión oral
  if (MISSION_DAYS_OF_WEEK.includes(dayOfWeek)) return 'mission'
  // Martes (2), Jueves (4): Lectura en contexto (Reader)
  if (SCRIPTED_MISSION_DAYS.includes(dayOfWeek)) return 'reader'
  // Sábado (6): Construcción de oraciones y patrones
  if (dayOfWeek === 6) return 'sentence_builder'
  // Domingo (0): Repaso consolidado
  return 'review'
}


