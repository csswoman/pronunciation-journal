// Planned structure:
// <CoachLanguageToggle />   — leaf, no sub-components

"use client";

import { useAICoachStore } from "@/lib/stores/aiCoachStore";
import { cn } from "@/lib/cn";

/**
 * Cycles the coach's reply language: Auto → Español → English → Auto.
 *
 * "Auto" is the default and follows the learner's CEFR level (Spanish through
 * A2, English from B1). The override exists because a level estimate can be
 * wrong, and a learner who cannot read the feedback has no way out otherwise.
 */
export function CoachLanguageToggle() {
  const coachLanguage = useAICoachStore((s) => s.coachLanguage);
  const setCoachLanguage = useAICoachStore((s) => s.setCoachLanguage);

  const label = coachLanguage === "es" ? "ES" : coachLanguage === "en" ? "EN" : "Auto";
  const title =
    coachLanguage === null
      ? "Idioma del coach: automático según tu nivel"
      : coachLanguage === "es"
        ? "El coach responde en español"
        : "El coach responde en inglés";

  return (
    <button
      type="button"
      onClick={() => setCoachLanguage(coachLanguage === null ? "es" : coachLanguage === "es" ? "en" : null)}
      title={title}
      aria-label={title}
      className={cn(
        "min-h-9 px-2 sm:h-8 rounded-md text-xxs font-semibold tracking-wide transition-colors cursor-pointer focus-ring",
        coachLanguage === null
          ? "text-fg-subtle hover:bg-surface-sunken"
          : "bg-primary-soft text-primary",
      )}
    >
      {label}
    </button>
  );
}
