export interface PracticeCategory {
  id: string
  title: string
  kicker: string
  description?: string
}

export const PRACTICE_CATEGORIES: Record<string, PracticeCategory> = {
  vocabulary: {
    id: "vocabulary",
    title: "Vocabulario",
    kicker: "Léxico y memoria",
  },
  pronunciation: {
    id: "pronunciation",
    title: "Pronunciación",
    kicker: "Sonidos y entonación",
  },
  contextReading: {
    id: "contextReading",
    title: "Contexto y lectura",
    kicker: "Inmersión y flujo",
  },
  games: {
    id: "games",
    title: "Juegos",
    kicker: "Práctica rápida",
    description: "Modos ágiles y lúdicos para reforzar tus reflejos en inglés",
  },
  reference: {
    id: "reference",
    title: "Consulta",
    kicker: "Herramientas de referencia",
    description: "Búsqueda libre, fuera del flujo de ejercicios",
  },
} as const
