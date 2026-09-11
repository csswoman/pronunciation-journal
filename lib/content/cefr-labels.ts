/**
 * Single source of truth for how CEFR levels are *named in Spanish* across the UI.
 *
 * Before this existed, each feature shipped its own list: the welcome tour called
 * A1 "Principiante" and A2 "Básico", while the reader called A1 "Básico" — so two
 * screens used "Básico" for two different levels. Any surface that shows a level
 * name to the learner should read it from here.
 *
 * Level *availability* is a separate decision and stays with each feature (the
 * reader only generates up to B2, for instance). This module only owns naming.
 */

import { CEFR_LEVELS, type CefrLevel } from "@/lib/essential-words/types";

/** Short name, for chips, badges and selectors where space is tight. */
export const CEFR_LEVEL_LABELS: Record<CefrLevel, string> = {
  A1: "Principiante",
  A2: "Básico",
  B1: "Intermedio",
  B2: "Intermedio alto",
  C1: "Avanzado",
};

/** One-line description of what the learner can do at each level. */
export const CEFR_LEVEL_DESCRIPTIONS: Record<CefrLevel, string> = {
  A1: "Sonidos básicos, frases sencillas y vocabulario inicial.",
  A2: "Estructuras cotidianas, preguntas comunes y conversación elemental.",
  B1: "Conversación fluida, vocabulario más amplio y comprensión auditiva.",
  B2: "Mayor naturalidad, matices de pronunciación y ritmo conectado.",
  C1: "Entonación precisa, pares mínimos sutiles y fluidez natural.",
};

/** `"B1 · Intermedio"` — for selectors that show code and name together. */
export function cefrLevelWithName(level: CefrLevel): string {
  return `${level} · ${CEFR_LEVEL_LABELS[level]}`;
}

/** `"Intermedio (B1)"` — for onboarding cards that lead with the name. */
export function cefrNameWithLevel(level: CefrLevel): string {
  return `${CEFR_LEVEL_LABELS[level]} (${level})`;
}

export interface CefrLevelOption {
  value: CefrLevel;
  label: CefrLevel;
  name: string;
  description: string;
}

/**
 * Options for a level picker, ordered easiest → hardest. Pass `upTo` when a
 * feature only supports part of the range, so the cap is explicit at the call
 * site instead of hidden in a hand-copied array.
 */
export function cefrLevelOptions(upTo?: CefrLevel): CefrLevelOption[] {
  const limit = upTo ? CEFR_LEVELS.indexOf(upTo) : CEFR_LEVELS.length - 1;
  return CEFR_LEVELS.slice(0, limit + 1).map((level) => ({
    value: level,
    label: level,
    name: CEFR_LEVEL_LABELS[level],
    description: CEFR_LEVEL_DESCRIPTIONS[level],
  }));
}
