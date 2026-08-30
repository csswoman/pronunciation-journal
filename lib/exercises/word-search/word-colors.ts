// Palette of distinct, accessible word colors for Word Search.
// Ensures each word found has a unique, theme-compatible highlight color.

export interface WordColorTheme {
  id: string
  name: string
  gridBg: string
  gridText: string
  gridRing: string
  cardBg: string
  cardBorder: string
  badgeBg: string
  badgeText: string
  iconBg: string
  strikeColor: string
}

export const WORD_COLOR_THEMES: WordColorTheme[] = [
  {
    id: 'emerald',
    name: 'Esmeralda',
    gridBg: 'bg-emerald-500/25 dark:bg-emerald-500/35',
    gridText: 'text-emerald-950 dark:text-emerald-100 font-bold',
    gridRing: 'ring-2 ring-emerald-500/70',
    cardBg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    cardBorder: 'border-emerald-500/40 dark:border-emerald-500/50',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-500/30',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    strikeColor: 'decoration-emerald-500/80',
  },
  {
    id: 'teal',
    name: 'Turquesa',
    gridBg: 'bg-teal-500/25 dark:bg-teal-500/35',
    gridText: 'text-teal-950 dark:text-teal-100 font-bold',
    gridRing: 'ring-2 ring-teal-500/70',
    cardBg: 'bg-teal-500/10 dark:bg-teal-500/20',
    cardBorder: 'border-teal-500/40 dark:border-teal-500/50',
    badgeBg: 'bg-teal-500/15 dark:bg-teal-500/30',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconBg: 'bg-teal-600 dark:bg-teal-500 text-white',
    strikeColor: 'decoration-teal-500/80',
  },
  {
    id: 'sky',
    name: 'Azul Celeste',
    gridBg: 'bg-sky-500/25 dark:bg-sky-500/35',
    gridText: 'text-sky-950 dark:text-sky-100 font-bold',
    gridRing: 'ring-2 ring-sky-500/70',
    cardBg: 'bg-sky-500/10 dark:bg-sky-500/20',
    cardBorder: 'border-sky-500/40 dark:border-sky-500/50',
    badgeBg: 'bg-sky-500/15 dark:bg-sky-500/30',
    badgeText: 'text-sky-700 dark:text-sky-300',
    iconBg: 'bg-sky-600 dark:bg-sky-500 text-white',
    strikeColor: 'decoration-sky-500/80',
  },
  {
    id: 'indigo',
    name: 'Índigo',
    gridBg: 'bg-indigo-500/25 dark:bg-indigo-500/35',
    gridText: 'text-indigo-950 dark:text-indigo-100 font-bold',
    gridRing: 'ring-2 ring-indigo-500/70',
    cardBg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    cardBorder: 'border-indigo-500/40 dark:border-indigo-500/50',
    badgeBg: 'bg-indigo-500/15 dark:bg-indigo-500/30',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    iconBg: 'bg-indigo-600 dark:bg-indigo-500 text-white',
    strikeColor: 'decoration-indigo-500/80',
  },
  {
    id: 'violet',
    name: 'Violeta',
    gridBg: 'bg-purple-500/25 dark:bg-purple-500/35',
    gridText: 'text-purple-950 dark:text-purple-100 font-bold',
    gridRing: 'ring-2 ring-purple-500/70',
    cardBg: 'bg-purple-500/10 dark:bg-purple-500/20',
    cardBorder: 'border-purple-500/40 dark:border-purple-500/50',
    badgeBg: 'bg-purple-500/15 dark:bg-purple-500/30',
    badgeText: 'text-purple-700 dark:text-purple-300',
    iconBg: 'bg-purple-600 dark:bg-purple-500 text-white',
    strikeColor: 'decoration-purple-500/80',
  },
  {
    id: 'amber',
    name: 'Ámbar',
    gridBg: 'bg-amber-500/25 dark:bg-amber-500/35',
    gridText: 'text-amber-950 dark:text-amber-100 font-bold',
    gridRing: 'ring-2 ring-amber-500/70',
    cardBg: 'bg-amber-500/10 dark:bg-amber-500/20',
    cardBorder: 'border-amber-500/40 dark:border-amber-500/50',
    badgeBg: 'bg-amber-500/15 dark:bg-amber-500/30',
    badgeText: 'text-amber-700 dark:text-amber-300',
    iconBg: 'bg-amber-600 dark:bg-amber-500 text-white',
    strikeColor: 'decoration-amber-500/80',
  },
  {
    id: 'rose',
    name: 'Rosa',
    gridBg: 'bg-rose-500/25 dark:bg-rose-500/35',
    gridText: 'text-rose-950 dark:text-rose-100 font-bold',
    gridRing: 'ring-2 ring-rose-500/70',
    cardBg: 'bg-rose-500/10 dark:bg-rose-500/20',
    cardBorder: 'border-rose-500/40 dark:border-rose-500/50',
    badgeBg: 'bg-rose-500/15 dark:bg-rose-500/30',
    badgeText: 'text-rose-700 dark:text-rose-300',
    iconBg: 'bg-rose-600 dark:bg-rose-500 text-white',
    strikeColor: 'decoration-rose-500/80',
  },
  {
    id: 'orange',
    name: 'Naranja',
    gridBg: 'bg-orange-500/25 dark:bg-orange-500/35',
    gridText: 'text-orange-950 dark:text-orange-100 font-bold',
    gridRing: 'ring-2 ring-orange-500/70',
    cardBg: 'bg-orange-500/10 dark:bg-orange-500/20',
    cardBorder: 'border-orange-500/40 dark:border-orange-500/50',
    badgeBg: 'bg-orange-500/15 dark:bg-orange-500/30',
    badgeText: 'text-orange-700 dark:text-orange-300',
    iconBg: 'bg-orange-600 dark:bg-orange-500 text-white',
    strikeColor: 'decoration-orange-500/80',
  },
]

export function getWordColorTheme(index: number): WordColorTheme {
  const safeIndex = Math.abs(index) % WORD_COLOR_THEMES.length
  return WORD_COLOR_THEMES[safeIndex]
}

export function getWordColorByPlacement(
  wordId: string,
  placements: Array<{ wordId: string }>,
): WordColorTheme {
  const index = placements.findIndex((p) => p.wordId === wordId)
  return getWordColorTheme(index >= 0 ? index : 0)
}
