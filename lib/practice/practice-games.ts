/**
 * Catalogue backing the /practice/games index.
 *
 * `href` is only meaningful for built games; upcoming ones are rendered as
 * inert tags, so they intentionally carry no route.
 */
export type GameSkill = 'vocabulary' | 'listening' | 'pronunciation' | 'grammar'

export interface PracticeGame {
  id: string
  title: string
  englishTitle: string
  description: string
  bannerDescription: string
  kicker: string
  href: string
  /** Practice-mode id recorded via `setLastPracticeMode` on launch. */
  modeId: string
  skill: GameSkill
  tone: 'butter' | 'sky' | 'mint' | 'lilac' | 'coral'
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
    bannerDescription:
      'Encuentra las palabras, entrena ortografía y escucha cómo suenan.',
    kicker: 'VOCABULARIO',
    href: '/practice/games',
    modeId: 'word-search',
    skill: 'vocabulary',
    tone: 'butter',
  },
  {
    id: 'word-rain',
    title: 'Lluvia de palabras',
    englishTitle: 'Word Rain',
    description:
      'Escribe las palabras antes de que toquen el suelo y guárdalas en tu vocabulario.',
    bannerDescription:
      'Escribe las palabras antes de que toquen el suelo y guárdalas en tu vocabulario.',
    kicker: 'MECANOGRAFÍA',
    href: '/practice/word-rain',
    modeId: 'word-rain',
    skill: 'vocabulary',
    tone: 'sky',
  },
  {
    id: 'phoneme-invaders',
    title: 'Phoneme Invaders',
    englishTitle: 'Phoneme Invaders',
    description: 'Arcade de discriminación auditiva y fonemas en inglés.',
    bannerDescription:
      'Escucha la palabra y dispara a la nave correcta antes de que toque el suelo.',
    kicker: 'DISCRIMINACIÓN',
    href: '/practice/phoneme-invaders',
    modeId: 'phoneme-invaders',
    skill: 'listening',
    tone: 'sky',
  },
  {
    id: 'weak-form-catcher',
    title: 'Weak Form Catcher',
    englishTitle: 'Weak Form Catcher',
    description: 'Entrena tu oído con inglés rápido y formas reducidas.',
    bannerDescription:
      'Escribe la forma completa en inglés mientras la frase reducida cae.',
    kicker: 'FLUIDEZ Y OÍDO',
    href: '/practice/weak-form-catcher',
    modeId: 'weak-form-catcher',
    skill: 'listening',
    tone: 'mint',
  },
  {
    id: 'chunk-duel',
    title: 'Chunk Duel',
    englishTitle: 'Chunk Duel',
    description: 'Desafío de velocidad con bloques de lenguaje frecuentes.',
    bannerDescription:
      'Ordena las fichas del bloque en inglés antes de que te gane el fantasma.',
    kicker: 'COLOCACIONES',
    href: '/practice/chunk-duel',
    modeId: 'chunk-duel',
    skill: 'grammar',
    tone: 'butter',
  },
  {
    id: 'false-friends-swipe',
    title: '¿Trampa? Falsos Amigos',
    englishTitle: 'False Friends Swipe',
    description: 'Desactiva las traducciones falsas más engañosas en inglés.',
    bannerDescription:
      'Evalúa la traducción rápida y decide si es verdad o una trampa.',
    kicker: 'VOCABULARIO CLAVE',
    href: '/practice/false-friends-swipe',
    modeId: 'false-friends-swipe',
    skill: 'vocabulary',
    tone: 'lilac',
  },
  {
    id: 'memory-match',
    title: 'Memory Match',
    englishTitle: 'Memory Match',
    description: 'Juego de memoria y asociación de vocabulario, audio e IPA.',
    bannerDescription:
      'Encuentra las parejas de palabras, traducciones, audios y pronunciación.',
    kicker: 'ASOCIACIÓN',
    href: '/practice/memory-match',
    modeId: 'memory-match',
    skill: 'vocabulary',
    tone: 'coral',
  },
] as const

export const UPCOMING_GAMES: readonly UpcomingGame[] = [
  {
    id: 'word-chain',
    title: 'Word Chain',
    description: 'Encadena palabras por su último sonido.',
  },
] as const
