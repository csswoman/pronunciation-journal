import { BookOpen, Bookmark, List, Mic, TrendingUp } from "@/components/icons";
import type { CefrLevel } from "@/lib/essential-words/types";
import type { PastelTone } from "@/components/layout/PastelCard";

export interface OnboardingLevelOption {
  id: CefrLevel;
  badge: string;
  name: string;
  en: string;
  es: string;
  tone: PastelTone;
}

export const ONBOARDING_CEFR_OPTIONS: OnboardingLevelOption[] = [
  {
    id: "A1",
    badge: "A1",
    name: "Principiante",
    en: "Hi! My name is Ana.",
    es: "¡Hola! Me llamo Ana.",
    tone: "sky",
  },
  {
    id: "A2",
    badge: "A2",
    name: "Básico",
    en: "Can you say that again, please?",
    es: "¿Puedes repetirlo, por favor?",
    tone: "mint",
  },
  {
    id: "B1",
    badge: "B1",
    name: "Intermedio",
    en: "I've been learning English for two years.",
    es: "Llevo dos años aprendiendo inglés.",
    tone: "butter",
  },
  {
    id: "B2",
    badge: "B2",
    name: "Intermedio alto",
    en: "I would have called you if I'd known.",
    es: "Te habría llamado si lo hubiera sabido.",
    tone: "coral",
  },
  {
    id: "C1",
    badge: "C1",
    name: "Avanzado",
    en: "It's not my cup of tea, but I get the appeal.",
    es: "No es lo mío, pero entiendo por qué gusta.",
    tone: "lilac",
  },
];

export const STEP_1_BULLETS = [
  { text: "Palabras con IPA y audio real", tone: "coral" as const },
  { text: "Los sonidos que no existen en español", tone: "sky" as const },
  { text: "Frases que la gente usa, no de libro", tone: "butter" as const },
  { text: "Sin rachas ni culpa: tú decides cuándo", tone: "mint" as const },
];

export const STEP_3_APP_AREAS = [
  {
    id: "ruta",
    title: "Ruta",
    desc: "Tu sesión de hoy, lista. Sin adivinar qué tocaba.",
    tone: "sky" as const,
    icon: BookOpen,
    badge: "Actividad 1 de 4",
    fullWidth: true,
  },
  {
    id: "palabras",
    title: "Palabras",
    desc: "Vocabulario con IPA, audio y ejemplos de uso real.",
    tone: "coral" as const,
    icon: Bookmark,
  },
  {
    id: "frases",
    title: "Frases",
    desc: "Expresiones que se usan de verdad, en contexto.",
    tone: "butter" as const,
    icon: List,
  },
  {
    id: "practica",
    title: "Práctica oral",
    desc: "Graba tu voz, compárala y corrige con el Coach.",
    tone: "mint" as const,
    icon: Mic,
  },
  {
    id: "progreso",
    title: "Progreso",
    desc: "Lo que ya dominas y lo que falta pulir.",
    tone: "lilac" as const,
    icon: TrendingUp,
  },
];
