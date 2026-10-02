/**
 * lib/focus/sprint-plan.ts
 *
 * Plan día a día que se muestra en el setup antes de activar un sprint.
 *
 * Regla: cada día describe algo que la app hace hoy. Nada de funciones
 * futuras. Fuentes verificadas:
 * - Formatos y ejercicios: `exercise-builder.ts` (conteos por formato).
 * - Segundas vueltas: botones "Repetir ejercicios" (FocusExerciseRunner),
 *   "Repetir trampa" (FocusErrorTrapPractice), "Volver a grabar"
 *   (FocusSongVoicePractice) y "Practicar con el Coach" (FocusDialogueBody).
 * - El sprint no agrupa fallos ni tiene botón de renovar: expira solo y
 *   el setup vuelve a estar disponible.
 *
 * Los minutos son estimaciones a partir del número de ejercicios de cada
 * formato; la UI los presenta como aproximados.
 */

import { getTopicMetadata, hasExample } from './topic-metadata'
import type { FocusContentKind, SprintGap } from './types'

export type PlanDayKind = FocusContentKind | 'free' | 'closing'

/**
 * - on_activate: se genera al activar el sprint (solo la mini-historia).
 * - on_demand: lo generas dentro del sprint con un botón.
 * - reuse: segunda vuelta sobre contenido que ya generaste.
 */
export type PlanDayAvailability = 'on_activate' | 'on_demand' | 'reuse'

export type SprintPlanDay = {
  day: number
  /** Formato del día; las segundas vueltas conservan el formato original. */
  kind: PlanDayKind
  title: string
  detail: string
  /** Estimación, no medición. */
  minutes: number
  availability: PlanDayAvailability
}

export type SprintPlan = {
  days: SprintPlanDay[]
  totalMinutes: number
  avgMinutes: number
  /** Focos elegidos en texto legible ("A y B"). */
  focusLabel: string
  /**
   * Error típico de hispanohablantes para el primer foco que tenga uno.
   * Viene del catálogo, no del historial del usuario.
   */
  example: { wrong: string; right: string } | null
  /**
   * True si algún foco es de sonido: el sprint lo trabaja con lectura,
   * dictado y canción, pero no corrige la pronunciación.
   */
  hasSoundFocus: boolean
}

type Example = SprintPlan['example']

type Activity = {
  kind: PlanDayKind
  availability: PlanDayAvailability
  title: string
  minutes: number
  detail: (example: Example) => string
}

/** Primera pasada: un formato nuevo por día, descrito con sus ejercicios reales. */
const NEW_FORMATS: Activity[] = [
  {
    kind: 'story', availability: 'on_activate', title: 'Mini-historia', minutes: 7,
    detail: () => 'Lees una historia con tus focos resaltados y haces hasta 5 ejercicios.',
  },
  {
    kind: 'drill', availability: 'on_demand', title: 'Drill de frases', minutes: 10,
    detail: () => 'Completas el hueco y traduces entre 8 y 10 frases.',
  },
  {
    kind: 'dialogue', availability: 'on_demand', title: 'Diálogo', minutes: 6,
    detail: () => 'Lees una charla cotidiana y ordenas sus frases.',
  },
  {
    kind: 'error_trap', availability: 'on_demand', title: 'Trampa de errores', minutes: 5,
    detail: (example) =>
      example
        ? `Corriges 5 frases con errores, como "${example.wrong}".`
        : 'Encuentras y corriges los errores en 5 frases.',
  },
  {
    kind: 'song', availability: 'on_demand', title: 'Canción o rima', minutes: 7,
    detail: () => 'Completas la letra y la cantas con tu micrófono.',
  },
]

/** Días extra: segundas vueltas con lo que ya existe en la app. */
const EXTRA_ROTATION: Activity[] = [
  {
    kind: 'free', availability: 'reuse', title: 'Lo que más te costó', minutes: 6,
    detail: () => 'Repites el formato donde más fallaste.',
  },
  {
    kind: 'dialogue', availability: 'reuse', title: 'Diálogo con el Coach', minutes: 8,
    detail: () => 'Practicas el diálogo en voz alta con el Coach.',
  },
  {
    kind: 'story', availability: 'reuse', title: 'Historia otra vez', minutes: 6,
    detail: () => 'Relees la historia y repites sus ejercicios.',
  },
  {
    kind: 'song', availability: 'reuse', title: 'Canta otra vez', minutes: 5,
    detail: () => 'Te grabas otra vez y comparas con tu intento anterior.',
  },
  {
    kind: 'error_trap', availability: 'reuse', title: 'Trampa otra vez', minutes: 5,
    detail: () => 'Repites la trampa y compruebas si ya no caes.',
  },
  {
    kind: 'drill', availability: 'reuse', title: 'Drill otra vez', minutes: 10,
    detail: () => 'Repites el drill; traducir es lo que más fija.',
  },
  {
    kind: 'free', availability: 'reuse', title: 'Tu formato favorito', minutes: 6,
    detail: () => 'Repites el formato que más te sirvió.',
  },
]

const CLOSING: Activity = {
  kind: 'closing', availability: 'reuse', title: 'Último día', minutes: 6,
  detail: () => 'Cierras lo pendiente. Después podrás elegir focos nuevos.',
}

function joinLabels(gaps: SprintGap[]): string {
  return gaps.map((g) => g.label).join(' y ')
}

function firstExample(gaps: SprintGap[]): Example {
  for (const gap of gaps) {
    const meta = getTopicMetadata(gap.targetId)
    if (hasExample(meta)) return { wrong: meta.wrong, right: meta.right }
  }
  return null
}

/** Actividad del día `index` (0-based) en un sprint de `durationDays`. */
function activityFor(index: number, durationDays: number): Activity {
  if (index < NEW_FORMATS.length) return NEW_FORMATS[index]
  if (index === durationDays - 1) return CLOSING
  return EXTRA_ROTATION[(index - NEW_FORMATS.length) % EXTRA_ROTATION.length]
}

/** Construye el plan del sprint para los focos y la duración elegidos. */
export function buildSprintPlan(gaps: SprintGap[], durationDays: number): SprintPlan {
  const focusLabel = joinLabels(gaps)
  const example = firstExample(gaps)
  const hasSoundFocus = gaps.some((g) => g.kind === 'phoneme')

  if (gaps.length === 0 || durationDays < 1) {
    return { days: [], totalMinutes: 0, avgMinutes: 0, focusLabel, example, hasSoundFocus }
  }

  const days: SprintPlanDay[] = Array.from({ length: durationDays }, (_, index) => {
    const activity = activityFor(index, durationDays)
    return {
      day: index + 1,
      kind: activity.kind,
      title: activity.title,
      detail: activity.detail(example),
      minutes: activity.minutes,
      availability: activity.availability,
    }
  })

  const totalMinutes = days.reduce((sum, d) => sum + d.minutes, 0)
  return {
    days,
    totalMinutes,
    avgMinutes: Math.round(totalMinutes / durationDays),
    focusLabel,
    example,
    hasSoundFocus,
  }
}
