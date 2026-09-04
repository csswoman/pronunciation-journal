import { BookOpen, Map, Mic, Sparkles, User } from "@/components/icons";
import type { CefrLevel } from "@/lib/essential-words/types";

export interface LevelOption {
  id: CefrLevel;
  title: string;
  desc: string;
}

export const CEFR_OPTIONS: LevelOption[] = [
  { id: "A1", title: "Principiante (A1)", desc: "Sonidos básicos, frases sencillas y vocabulario inicial." },
  { id: "A2", title: "Básico (A2)", desc: "Estructuras cotidianas, preguntas comunes y conversación elemental." },
  { id: "B1", title: "Intermedio (B1)", desc: "Conversación fluida, vocabulario más amplio y comprensión auditiva." },
  { id: "B2", title: "Intermedio alto (B2)", desc: "Mayor naturalidad, matices de pronunciación y ritmo conectado." },
  { id: "C1", title: "Avanzado (C1)", desc: "Entonación precisa, pares mínimos sutiles y fluidez natural." },
];

export const STEP_1_FEATURES = [
  { icon: Mic, title: "Práctica oral activa", desc: "Grábate y recibe retroalimentación precisa sobre sonidos y patrones difíciles." },
  { icon: Map, title: "A tu propio ritmo", desc: "Sin presiones ni gamificación excesiva: avanza según tus objetivos reales." },
];

export const STEP_3_AREAS = [
  { icon: BookOpen, title: "1. Ruta (Cursos)", desc: "Lecciones estructuradas por unidades con teoría y ejercicios guiados." },
  { icon: Sparkles, title: "2. Práctica & Sound Lab", desc: "Entrena contrastes fonéticos difíciles y realiza misiones orales interactivas." },
  { icon: User, title: "3. Perfil & Preferencias", desc: "Cambia tu nivel en cualquier momento o crea una cuenta para sincronizar." },
];
