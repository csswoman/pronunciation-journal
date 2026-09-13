/**
 * Landing content — single source of truth for public marketing copy.
 *
 * Numbers here are counted from real shipped content, not aspirational:
 *   words   → public/essential-words/catalog-index.json  (2800 entries)
 *   sounds  → public/sounds/                             (110 files)
 *   lessons → public/mini-lessons/                       (66 lessons)
 *   decks   → public/grammar-decks/                      (276 decks)
 * Re-check these before changing them.
 */
import type { IllustrationKey } from "@/lib/illustrations/registry";

export interface LandingStat {
  value: string;
  label: string;
}

export interface LandingPractice {
  title: string;
  description: string;
  tags: readonly string[];
  illustration: IllustrationKey;
}

export interface LandingSignal {
  title: string;
  description: string;
}

export const LANDING_STATS: readonly LandingStat[] = [
  { value: "2.800", label: "palabras esenciales con forma débil y fuerte" },
  { value: "110", label: "sonidos del inglés con audio de referencia" },
  { value: "66", label: "mini-lecciones de A1 a C2" },
  { value: "276", label: "mazos de patrones gramaticales" },
] as const;

export const LANDING_PRACTICES: readonly LandingPractice[] = [
  {
    title: "Sound Lab",
    description:
      "Grabas, ves tu onda junto a la de referencia y descubres qué sonido se te escapa. Pares mínimos, acento y habla conectada.",
    tags: ["Grabación", "Pares mínimos", "IPA"],
    illustration: "domainSpeaking",
  },
  {
    title: "Palabras esenciales",
    description:
      "Las 2.800 palabras que aparecen en casi todo lo que vas a escuchar, con su forma débil real, no la del diccionario.",
    tags: ["Formas débiles", "Repetición espaciada", "A1 a C2"],
    illustration: "emptyDeck",
  },
  {
    title: "Journal",
    description:
      "Escribes lo que te pasó hoy y recibes correcciones con explicación. Tu vocabulario sale de tu vida, no de una lista genérica.",
    tags: ["Escritura", "Corrección con IA", "Vocabulario propio"],
    illustration: "domainWriting",
  },
  {
    title: "Misiones orales",
    description:
      "Conversaciones con objetivo concreto. Pides un café, explicas un problema, defiendes una idea. Se evalúa lo que dijiste.",
    tags: ["Conversación", "Voz", "Evaluación"],
    illustration: "journalLanguageBook",
  },
] as const;

/** What the app is allowed to conclude from each kind of action. */
export const LANDING_SIGNALS: readonly LandingSignal[] = [
  {
    title: "Leer es exposición",
    description:
      "Abrir una lección cuenta como haberla visto. Nada más. No mueve tu nivel.",
  },
  {
    title: "Guardar es intención",
    description:
      "Una palabra guardada dice qué te importa, y entra en la cola de repaso. Todavía no es dominio.",
  },
  {
    title: "Practicar es evidencia",
    description:
      "Solo el ejercicio evaluado mueve tu perfil. La calificación es determinista, con errores comunes ya catalogados.",
  },
  {
    title: "El dominio se gana con el tiempo",
    description:
      "Requiere acertar en sesiones separadas. No se infiere de rachas, de clics ni de volumen de actividad.",
  },
] as const;

export const LANDING_EXERCISE_MODES: readonly string[] = [
  "Completar",
  "Opción múltiple",
  "Ordenar",
  "Emparejar",
  "Dictado",
  "Hablar",
  "Escribir",
  "Tarjeta",
] as const;
