// La colocación es una inferencia sobre unas 30 muestras: se equivocará en
// algunas palabras. Es aceptable porque este control corrige la política, no
// porque la estimación inicial se presente como certeza.

import { seededRandomSource } from "../execution-context";
import type { LearningItem } from "../verification/types";

/** Entre una y dos de cada veinte inferencias activadas se vuelven a comprobar. */
export const CONTROL_RATE = 0.075;

/** Selecciona controles reproducibles sin mutar los ítems de origen. */
export function pickControlSamples(items: LearningItem[], seed: number): LearningItem[] {
  const eligible = items.filter((item) => item.placementInference);
  if (eligible.length === 0) return [];

  const random = seededRandomSource(seed);
  const shuffled = [...eligible];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selected = Math.floor(random.next() * (index + 1));
    [shuffled[index], shuffled[selected]] = [shuffled[selected], shuffled[index]];
  }

  const target = Math.max(1, Math.round(eligible.length * CONTROL_RATE));
  return shuffled.slice(0, target);
}

/**
 * Recalibra de forma suave: combinar la tasa observada con la confianza
 * vigente evita que una muestra pequeña provoque una avalancha de controles.
 */
export function recalibrateConfidence(
  current: number,
  control: { checked: number; failed: number },
): number {
  if (control.checked <= 0) return current;

  const observed = 1 - control.failed / control.checked;
  const blended = current * 0.5 + observed * 0.5;
  return Math.min(1, Math.max(0, blended));
}
