import type { LessonCategory, LessonLevel } from "./schemas";

export const MINI_LESSON_LEVEL_LABELS: Record<LessonLevel, string> = {
  basic: "Básico",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export const MINI_LESSON_CATEGORY_LABELS: Record<LessonCategory, string> = {
  pronunciation: "Pronunciación",
  grammar: "Gramática",
  vocabulary: "Vocabulario",
  listening: "Escucha",
  speaking: "Expresión oral",
  writing: "Escritura",
  idioms: "Modismos",
  collocations: "Colocaciones",
};
