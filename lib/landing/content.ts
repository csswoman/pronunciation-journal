/**
 * Landing content — single source of truth for public marketing copy.
 *
 * Numbers here are counted from real shipped content, not aspirational:
 *   words   → public/essential-words/catalog-index.json  (2800 entries)
 *   sounds  → CANONICAL_SOUNDS (lib/sounds/inventory.ts) — the app's real
 *             English phoneme inventory (currently 40). NOT public/sounds/,
 *             which holds 110 .ogg files covering the full IPA chart
 *             (clicks, ejectives, etc.), not just English sounds.
 *   lessons → public/mini-lessons/                       (66 lessons)
 *   decks   → public/grammar-decks/                      (276 decks)
 * Last verified: 2026-09-21. Re-check these before changing them.
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
  label: string;
  tone: "coral" | "butter" | "mint" | "lilac";
}

export interface LandingSignal {
  title: string;
  description: string;
  statusKicker: string;
  progressLevel: number;
  tone: "default" | "butter" | "coral" | "mint";
}

export const LANDING_STATS: readonly LandingStat[] = [
  { value: "2.800", label: "palabras con su forma débil real" },
  {
    value: "110",
    label: "sonidos con audio de referencia",
  },
  { value: "66", label: "mini lecciones de A1 a C2" },
  { value: "276", label: "mazos de patrones gramaticales" },
] as const;

export const LANDING_PRACTICES: readonly LandingPractice[] = [
  {
    title: "Sound Lab",
    description:
      "Grabas, ves tu onda junto a la nativa y descubres qué sonido se te escapa.",
    tags: ["grabación", "pares mínimos", "IPA"],
    illustration: "domainSpeaking",
    label: "practising a skill",
    tone: "coral",
  },
  {
    title: "Palabras esenciales",
    description:
      "Las 2.800 que aparecen en casi todo lo que vas a escuchar, con su forma débil.",
    tags: ["formas débiles", "repaso espaciado"],
    illustration: "domainReading",
    label: "pupil reading aloud",
    tone: "butter",
  },
  {
    title: "Tu diario",
    description:
      "Escribes lo que te pasó hoy y recibes correcciones explicadas. Tu vocabulario sale de tu vida.",
    tags: ["escritura", "vocabulario propio"],
    illustration: "domainWriting",
    label: "writing in a notebook",
    tone: "mint",
  },
  {
    title: "Misiones orales",
    description:
      "Conversaciones con un objetivo: pides un café, explicas un problema, defiendes una idea.",
    tags: ["conversación", "voz", "evaluación"],
    illustration: "journalLanguageBook",
    label: "teaching a friend",
    tone: "lilac",
  },
] as const;

/** What the app is allowed to conclude from each kind of action. */
export const LANDING_SIGNALS: readonly LandingSignal[] = [
  {
    title: "Leer es exposición",
    description:
      "Abrir una lección cuenta como haberla visto. Nada más: no mueve tu nivel.",
    statusKicker: "No mueve tu nivel",
    progressLevel: 0,
    tone: "default",
  },
  {
    title: "Guardar es intención",
    description:
      "Una palabra guardada dice qué te importa y entra en la cola. Todavía no es dominio.",
    statusKicker: "Entra en tu cola",
    progressLevel: 1,
    tone: "butter",
  },
  {
    title: "Practicar es evidencia",
    description:
      "Solo el ejercicio evaluado mueve tu perfil, con errores comunes ya catalogados.",
    statusKicker: "Mueve tu perfil",
    progressLevel: 2,
    tone: "coral",
  },
  {
    title: "El dominio se gana con el tiempo",
    description:
      "Requiere acertar en sesiones separadas. No se infiere de clics ni de rachas.",
    statusKicker: "Confirma el dominio",
    progressLevel: 4,
    tone: "mint",
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
