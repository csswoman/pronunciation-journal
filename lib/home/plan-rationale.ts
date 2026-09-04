import type { WeakestPhonemeHome } from "@/lib/home/constants";

/**
 * "Explicabilidad en Home": turns the signals the home page already has into a
 * short, human sentence explaining WHY today's plan looks the way it does.
 *
 * Pure module — no React, no I/O. Presentation lives in HomePlanRationale.
 */
export interface PlanRationaleInput {
  /** A scheduled review (words or sounds) is due today. */
  reviewDue: boolean;
  /** Learner has no meaningful practice history yet. */
  isNewLearner: boolean;
  /** Today's concept mini-lesson, if the plan opens with one. */
  conceptLesson: { title: string } | null;
  /** Weakest phoneme from the diagnostic/SRS, if known. */
  weakestPhoneme: WeakestPhonemeHome | null;
}

export interface PlanRationale {
  /** One clause naming the strongest driver of today's plan. */
  headline: string;
  /** Optional supporting clause; empty string when there is nothing to add. */
  detail: string;
}

function cleanIpa(ipa: string | null | undefined): string {
  return (ipa ?? "").replace(/^\/+|\/+$/g, "").trim();
}

/**
 * Priority order mirrors how the daily plan itself is composed:
 * new learner → due reviews → weakest sound → concept lesson → generic.
 * Returns null only when there is genuinely nothing worth explaining.
 */
export function derivePlanRationale(input: PlanRationaleInput): PlanRationale | null {
  const { reviewDue, isNewLearner, conceptLesson, weakestPhoneme } = input;

  if (isNewLearner) {
    return {
      headline: "Tu plan empieza suave porque aún estás calibrando tu nivel.",
      detail: conceptLesson
        ? `Hoy abre con “${conceptLesson.title}” para darte una base.`
        : "",
    };
  }

  if (reviewDue) {
    return {
      headline: "Hoy priorizamos repaso: tienes tarjetas que vencen y olvidarías si esperas.",
      detail: weakestPhoneme
        ? `Después seguimos con ${describeWeakSound(weakestPhoneme)}.`
        : "",
    };
  }

  if (weakestPhoneme) {
    return {
      headline: `El plan gira en torno a ${describeWeakSound(weakestPhoneme)} porque es tu punto más débil ahora.`,
      detail: conceptLesson ? `Lo enmarca la lección “${conceptLesson.title}”.` : "",
    };
  }

  if (conceptLesson) {
    return {
      headline: `Hoy toca el concepto “${conceptLesson.title}” según tu progresión.`,
      detail: "",
    };
  }

  return null;
}

function describeWeakSound(weak: WeakestPhonemeHome): string {
  const ipa = cleanIpa(weak.ipa);
  const confusable = cleanIpa(weak.confusableIpa);
  if (ipa && confusable) return `el sonido /${ipa}/ (lo confundes con /${confusable}/)`;
  if (ipa) return `el sonido /${ipa}/`;
  if (weak.label) return `el sonido “${weak.label}”`;
  return "tu sonido más débil";
}
