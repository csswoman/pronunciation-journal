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
    gridBg: 'bg-emerald-500/20 dark:bg-emerald-400/25',
    gridText: 'text-emerald-950 dark:text-emerald-200 font-bold',
    gridRing: 'ring-2 ring-emerald-500/60 dark:ring-emerald-400/60',
    cardBg: 'bg-emerald-500/10 dark:bg-surface-raised',
    cardBorder: 'border-emerald-500/35 dark:border-emerald-400/35',
    badgeBg: 'bg-emerald-500/15 dark:bg-emerald-400/20',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    iconBg: 'bg-emerald-600 dark:bg-emerald-500 text-white',
    strikeColor: 'decoration-emerald-500/80 dark:decoration-emerald-400/80',
  },
  {
    id: 'cyan',
    name: 'Cian',
    gridBg: 'bg-cyan-500/20 dark:bg-cyan-400/25',
    gridText: 'text-cyan-950 dark:text-cyan-200 font-bold',
    gridRing: 'ring-2 ring-cyan-500/60 dark:ring-cyan-400/60',
    cardBg: 'bg-cyan-500/10 dark:bg-surface-raised',
    cardBorder: 'border-cyan-500/35 dark:border-cyan-400/35',
    badgeBg: 'bg-cyan-500/15 dark:bg-cyan-400/20',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    iconBg: 'bg-cyan-600 dark:bg-cyan-500 text-white',
    strikeColor: 'decoration-cyan-500/80 dark:decoration-cyan-400/80',
  },
  {
    id: 'blue',
    name: 'Azul',
    gridBg: 'bg-blue-500/20 dark:bg-blue-400/25',
    gridText: 'text-blue-950 dark:text-blue-200 font-bold',
    gridRing: 'ring-2 ring-blue-500/60 dark:ring-blue-400/60',
    cardBg: 'bg-blue-500/10 dark:bg-surface-raised',
    cardBorder: 'border-blue-500/35 dark:border-blue-400/35',
    badgeBg: 'bg-blue-500/15 dark:bg-blue-400/20',
    badgeText: 'text-blue-700 dark:text-blue-300',
    iconBg: 'bg-blue-600 dark:bg-blue-500 text-white',
    strikeColor: 'decoration-blue-500/80 dark:decoration-blue-400/80',
  },
  {
    id: 'violet',
    name: 'Violeta',
    gridBg: 'bg-violet-500/20 dark:bg-violet-400/25',
    gridText: 'text-violet-950 dark:text-violet-200 font-bold',
    gridRing: 'ring-2 ring-violet-500/60 dark:ring-violet-400/60',
    cardBg: 'bg-violet-500/10 dark:bg-surface-raised',
    cardBorder: 'border-violet-500/35 dark:border-violet-400/35',
    badgeBg: 'bg-violet-500/15 dark:bg-violet-400/20',
    badgeText: 'text-violet-700 dark:text-violet-300',
    iconBg: 'bg-violet-600 dark:bg-violet-500 text-white',
    strikeColor: 'decoration-violet-500/80 dark:decoration-violet-400/80',
  },
  {
    id: 'fuchsia',
    name: 'Fucsia',
    gridBg: 'bg-fuchsia-500/20 dark:bg-fuchsia-400/25',
    gridText: 'text-fuchsia-950 dark:text-fuchsia-200 font-bold',
    gridRing: 'ring-2 ring-fuchsia-500/60 dark:ring-fuchsia-400/60',
    cardBg: 'bg-fuchsia-500/10 dark:bg-surface-raised',
    cardBorder: 'border-fuchsia-500/35 dark:border-fuchsia-400/35',
    badgeBg: 'bg-fuchsia-500/15 dark:bg-fuchsia-400/20',
    badgeText: 'text-fuchsia-700 dark:text-fuchsia-300',
    iconBg: 'bg-fuchsia-600 dark:bg-fuchsia-500 text-white',
    strikeColor: 'decoration-fuchsia-500/80 dark:decoration-fuchsia-400/80',
  },
  {
    id: 'pink',
    name: 'Rosa',
    gridBg: 'bg-pink-500/20 dark:bg-pink-400/25',
    gridText: 'text-pink-950 dark:text-pink-200 font-bold',
    gridRing: 'ring-2 ring-pink-500/60 dark:ring-pink-400/60',
    cardBg: 'bg-pink-500/10 dark:bg-surface-raised',
    cardBorder: 'border-pink-500/35 dark:border-pink-400/35',
    badgeBg: 'bg-pink-500/15 dark:bg-pink-400/20',
    badgeText: 'text-pink-700 dark:text-pink-300',
    iconBg: 'bg-pink-600 dark:bg-pink-500 text-white',
    strikeColor: 'decoration-pink-500/80 dark:decoration-pink-400/80',
  },
  {
    id: 'teal',
    name: 'Turquesa',
    gridBg: 'bg-teal-500/20 dark:bg-teal-400/25',
    gridText: 'text-teal-950 dark:text-teal-200 font-bold',
    gridRing: 'ring-2 ring-teal-500/60 dark:ring-teal-400/60',
    cardBg: 'bg-teal-500/10 dark:bg-surface-raised',
    cardBorder: 'border-teal-500/35 dark:border-teal-400/35',
    badgeBg: 'bg-teal-500/15 dark:bg-teal-400/20',
    badgeText: 'text-teal-700 dark:text-teal-300',
    iconBg: 'bg-teal-600 dark:bg-teal-500 text-white',
    strikeColor: 'decoration-teal-500/80 dark:decoration-teal-400/80',
  },
  {
    id: 'lime',
    name: 'Lima',
    gridBg: 'bg-lime-500/20 dark:bg-lime-400/25',
    gridText: 'text-lime-950 dark:text-lime-200 font-bold',
    gridRing: 'ring-2 ring-lime-500/60 dark:ring-lime-400/60',
    cardBg: 'bg-lime-500/10 dark:bg-surface-raised',
    cardBorder: 'border-lime-500/35 dark:border-lime-400/35',
    badgeBg: 'bg-lime-500/15 dark:bg-lime-400/20',
    badgeText: 'text-lime-700 dark:text-lime-300',
    iconBg: 'bg-lime-600 dark:bg-lime-500 text-white',
    strikeColor: 'decoration-lime-500/80 dark:decoration-lime-400/80',
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
