export interface PracticeGame {
  id: string
  title: string
  description: string
  icon: string
  href: string
  tag: string
  available: boolean
}

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

export const PRACTICE_GAMES: readonly PracticeGame[] = [
  {
    id: "word-chain",
    title: "Word Chain",
    description: "Encadena palabras por su último sonido",
    icon: "Zap",
    href: "/practice/games/word-chain",
    tag: "Próximamente",
    available: false,
  },
  {
    id: "chunk-duel",
    title: "Chunk Duel",
    description: "Desafío de bloques de lenguaje frecuentes",
    icon: "Flame",
    href: "/practice/games/chunk-duel",
    tag: "Próximamente",
    available: false,
  },
  {
    id: "phoneme-invaders",
    title: "Phoneme Invaders",
    description: "Arcade de discriminación auditiva y fonemas",
    icon: "BrainCircuit",
    href: "/practice/games/phoneme-invaders",
    tag: "Próximamente",
    available: false,
  },
  {
    id: "word-rain",
    title: "Lluvia de palabras",
    description: "Escribe y reconoce vocabulario contra el reloj",
    icon: "Trophy",
    href: "/practice/games/word-rain",
    tag: "Próximamente",
    available: false,
  },
] as const
