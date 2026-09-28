/**
 * lib/focus/setup-copy.ts
 *
 * Textos del setup de Modo Foco que dependen del estado (paso, focos elegidos,
 * duración, origen de las sugerencias). Centralizados como funciones puras
 * para que la UI nunca muestre un mensaje que contradiga lo que el usuario ve.
 */

import type { GapSuggestion } from './gap-suggestions'
import type { SprintGap } from './types'

export type SetupStepId = 'focus' | 'plan'

export const MAX_FOCUS_GAPS = 2

/** Subtítulo del encabezado según el paso y lo elegido. */
export function setupSubtitle(step: SetupStepId, selectedCount: number, durationDays: number): string {
  if (step === 'plan') {
    return `Con ${durationDays} días, cada sesión dura unos minutos. Puedes cambiar la duración antes de empezar.`
  }
  if (selectedCount === 0) {
    return 'Elige una o dos cosas que quieras dominar. Todo el sprint (historias, ejercicios y diálogos) se escribe alrededor de ellas.'
  }
  if (selectedCount === 1) {
    return 'Buena elección. Puedes sumar un segundo foco o continuar solo con este.'
  }
  return 'Tienes tus dos focos. Continúa para ver cómo se reparte tu sprint.'
}

/** Resumen corto que se lee en la barra inferior. */
export function activationSummary(
  step: SetupStepId,
  gaps: SprintGap[],
  durationDays: number,
): { headline: string; hint: string | null } {
  if (gaps.length === 0) {
    return { headline: 'Aún no eliges un foco', hint: 'Toca una tarjeta para empezar.' }
  }
  const labels = gaps.map((g) => g.label).join(' · ')
  if (step === 'plan') {
    return { headline: labels, hint: `${durationDays} días` }
  }
  const remaining = MAX_FOCUS_GAPS - gaps.length
  return { headline: labels, hint: remaining > 0 ? 'Puedes sumar uno más' : null }
}

/** Texto del botón principal de la barra inferior. */
export function primaryActionLabel(
  step: SetupStepId,
  selectedCount: number,
  durationDays: number,
  activationStageLabel: string | null,
): string {
  if (activationStageLabel) return activationStageLabel
  if (step === 'plan') return `Empezar sprint de ${durationDays} días`
  if (selectedCount === 0) return 'Elige un foco'
  return 'Ver mi plan'
}

/** Introducción de la pestaña de sugerencias según de dónde salgan. */
export function suggestionsIntro(suggestions: GapSuggestion[]): string {
  const personal = suggestions.filter((s) => s.source !== 'default').length
  if (personal === 0) {
    return 'Aún no tenemos suficiente práctica tuya para personalizar esto. Son los tropiezos más comunes en hispanohablantes.'
  }
  if (personal === suggestions.length) {
    return 'Salen de tus fallos en la práctica. Empieza por el que menos precisión tenga.'
  }
  return 'Las primeras salen de tus fallos en la práctica; el resto son tropiezos comunes en hispanohablantes.'
}
