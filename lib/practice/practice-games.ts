/**
 * Catalogue backing the /practice/games index.
 *
 * `href` is only meaningful for built games; upcoming ones are rendered as
 * inert tags, so they intentionally carry no route.
 */
export interface PracticeGame {
  id: string
  title: string
  englishTitle: string
  description: string
  href: string
  /** Practice-mode id recorded via `setLastPracticeMode` on launch. */
  modeId: string
}

export interface UpcomingGame {
  id: string
  title: string
  description: string
}

export const PRACTICE_GAMES: readonly PracticeGame[] = [
  {
    id: 'word-search',
    title: 'Sopa de letras',
    englishTitle: 'Word Search',
    description:
      'Encuentra palabras con pistas ortográficas, fonemas y audio nativo.',
    href: '/practice/word-search',
    modeId: 'word-search',
  },
  {
    id: 'word-rain',
    title: 'Lluvia de palabras',
    englishTitle: 'Word Rain',
    description:
      'Escribe las palabras antes de que toquen el suelo y guárdalas en tu vocabulario.',
    href: '/practice/word-rain',
    modeId: 'word-rain',
  },
] as const

export const UPCOMING_GAMES: readonly UpcomingGame[] = [
  {
    id: 'word-chain',
    title: 'Word Chain',
    description: 'Encadena palabras por su último sonido.',
  },
  {
    id: 'chunk-duel',
    title: 'Chunk Duel',
    description: 'Desafío de bloques de lenguaje frecuentes.',
  },
  {
    id: 'phoneme-invaders',
    title: 'Phoneme Invaders',
    description: 'Arcade de discriminación auditiva y fonemas.',
  },
] as const
