import type {
  CellCoordinate,
  WordPlacement,
  WordSearchItem,
  WordSearchMode,
  WordSearchPuzzle,
  WordSearchSource,
} from './types'

// Common English letter frequency distribution for natural grid fill
const LETTER_WEIGHTS = 'EEEEEEEEAAAAAIIIIIROOOONNNNTTTTSSSSLLLLCCCCUUUUDDDDPIIMHHGGBBFFYYWWKVXZJQ'

export const MIN_WORD_SEARCH_ITEMS = 3
export const MAX_WORD_SEARCH_LENGTH = 12

// 8 standard directions: [dRow, dCol]
const STANDARD_DIRECTIONS: [number, number][] = [
  [0, 1], // Horizontal right
  [1, 0], // Vertical down
  [1, 1], // Diagonal down-right
  [-1, 1], // Diagonal up-right
  [0, -1], // Horizontal left
  [-1, 0], // Vertical up
  [1, -1], // Diagonal down-left
  [-1, -1], // Diagonal up-left
]

// Easier directions (no reverse) for beginners or mobile ease
const EASY_DIRECTIONS: [number, number][] = [
  [0, 1], // Horizontal right
  [1, 0], // Vertical down
  [1, 1], // Diagonal down-right
]

export interface GenerateGridOptions {
  id?: string
  title?: string
  topic?: string
  source?: WordSearchSource
  mode?: WordSearchMode
  allowReverse?: boolean
  forcedSize?: number
}

/** Sanitizes a raw word for word search (uppercase letters only). */
export function sanitizeWord(raw: string): string {
  return raw
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '')
}

/** Generates a random uppercase letter following English frequencies. */
function getRandomLetter(): string {
  const idx = Math.floor(Math.random() * LETTER_WEIGHTS.length)
  return LETTER_WEIGHTS[idx] ?? 'E'
}

/** Calculates an optimal square grid dimension based on word list. */
export function calculateOptimalGridSize(words: string[]): number {
  if (words.length === 0) return 8
  const maxLen = Math.max(...words.map((w) => w.length))
  const totalLetters = words.reduce((acc, w) => acc + w.length, 0)
  // Grid area should ideally be at least ~2.2x total letters to avoid tight congestion
  const densityMin = Math.ceil(Math.sqrt(totalLetters * 2.2))
  const size = Math.max(maxLen + 2, densityMin, 8)
  return Math.min(Math.max(size, 8), 12)
}

/** Attempts to place a word on the grid. */
function tryPlaceWord(
  grid: (string | null)[][],
  size: number,
  word: string,
  wordId: string,
  directions: [number, number][]
): WordPlacement | null {
  const wordLen = word.length
  // Shuffle all candidate coordinates and directions
  const coords: CellCoordinate[] = []
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      coords.push({ row: r, col: c })
    }
  }
  // Fisher-Yates shuffle coordinates
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = coords[i]
    coords[i] = coords[j]
    coords[j] = temp
  }

  // Shuffle directions
  const shuffledDirs = [...directions].sort(() => Math.random() - 0.5)

  for (const { row, col } of coords) {
    for (const [dRow, dCol] of shuffledDirs) {
      const endRow = row + dRow * (wordLen - 1)
      const endCol = col + dCol * (wordLen - 1)

      // Bounds check
      if (endRow < 0 || endRow >= size || endCol < 0 || endCol >= size) {
        continue
      }

      // Check letter overlap validity
      let valid = true
      const path: CellCoordinate[] = []

      for (let step = 0; step < wordLen; step++) {
        const currR = row + dRow * step
        const currC = col + dCol * step
        const currentLetter = grid[currR][currC]
        const expectedLetter = word[step]

        if (currentLetter !== null && currentLetter !== expectedLetter) {
          valid = false
          break
        }
        path.push({ row: currR, col: currC })
      }

      if (valid) {
        // Place letters on grid
        for (let step = 0; step < wordLen; step++) {
          const { row: r, col: c } = path[step]
          grid[r][c] = word[step]
        }

        return {
          wordId,
          word,
          start: { row, col },
          end: { row: endRow, col: endCol },
          direction: [dRow, dCol],
          path,
        }
      }
    }
  }

  return null
}

/**
 * Creates a playable WordSearchPuzzle from given items.
 */
export function createWordSearchPuzzle(
  items: Array<Omit<WordSearchItem, 'found' | 'foundAt'> & { found?: boolean }>,
  options: GenerateGridOptions = {}
): WordSearchPuzzle {
  const {
    id = `puzzle_${Date.now()}`,
    title = 'Búsqueda de Palabras',
    topic = 'Vocabulario General',
    source = 'curated',
    mode = 'classic',
    allowReverse = false,
    forcedSize,
  } = options

  // 1. Sanitize items and remove invalid or duplicate answers. Two clues for
  // the same visible word make a puzzle impossible to reason about.
  const validItems: WordSearchItem[] = []
  const seenWords = new Set<string>()
  for (const item of items) {
    const clean = sanitizeWord(item.word)
    if (
      clean.length >= 2 &&
      clean.length <= MAX_WORD_SEARCH_LENGTH &&
      !seenWords.has(clean)
    ) {
      seenWords.add(clean)
      validItems.push({
        ...item,
        word: clean,
        displayWord: item.displayWord || item.word,
        found: false,
      })
    }
  }

  if (validItems.length < MIN_WORD_SEARCH_ITEMS) {
    throw new Error(
      `Se necesitan al menos ${MIN_WORD_SEARCH_ITEMS} palabras distintas de hasta ${MAX_WORD_SEARCH_LENGTH} letras.`,
    )
  }

  // 2. Determine grid size
  const wordsToPlace = validItems.map((item) => item.word)
  const size = forcedSize || calculateOptimalGridSize(wordsToPlace)

  // 3. Sort items longest first to maximize packing success
  const sortedItems = [...validItems].sort((a, b) => b.word.length - a.word.length)

  // 4. Initialize empty grid (NxN of nulls)
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  )

  const directions = allowReverse ? STANDARD_DIRECTIONS : EASY_DIRECTIONS
  const placements: WordPlacement[] = []
  const placedWordIds = new Set<string>()

  for (const item of sortedItems) {
    const placement = tryPlaceWord(grid, size, item.word, item.id, directions)
    if (placement) {
      placements.push(placement)
      placedWordIds.add(item.id)
    }
  }

  // Filter items to only those successfully placed on the grid
  const finalItems = validItems.filter((item) => placedWordIds.has(item.id))

  if (finalItems.length < MIN_WORD_SEARCH_ITEMS) {
    throw new Error('No se pudo crear un tablero jugable con estas palabras.')
  }

  // 5. Fill empty cells with weighted random letters
  const finalizedGrid: string[][] = grid.map((row) =>
    row.map((cell) => cell ?? getRandomLetter())
  )

  return {
    id,
    title,
    topic,
    source,
    mode,
    size,
    grid: finalizedGrid,
    items: finalItems,
    placements,
  }
}

/**
 * Calculates a straight path of coordinates between start and end.
 * Returns empty array if not on a straight horizontal, vertical, or 45-deg diagonal line.
 */
export function getPathBetween(start: CellCoordinate, end: CellCoordinate): CellCoordinate[] {
  const dRow = end.row - start.row
  const dCol = end.col - start.col

  const absRow = Math.abs(dRow)
  const absCol = Math.abs(dCol)

  // Must be horizontal (dRow == 0), vertical (dCol == 0), or diagonal (absRow == absCol)
  if (dRow !== 0 && dCol !== 0 && absRow !== absCol) {
    return []
  }

  const steps = Math.max(absRow, absCol)
  if (steps === 0) {
    return [start]
  }

  const stepRow = dRow === 0 ? 0 : dRow / steps
  const stepCol = dCol === 0 ? 0 : dCol / steps

  const path: CellCoordinate[] = []
  for (let i = 0; i <= steps; i++) {
    path.push({
      row: start.row + stepRow * i,
      col: start.col + stepCol * i,
    })
  }

  return path
}

/**
 * Checks if a given path matches any unplaced or placed word.
 * Returns the matching wordId or null.
 */
export function checkWordMatch(
  path: CellCoordinate[],
  placements: WordPlacement[]
): string | null {
  if (path.length < 2) return null

  const start = path[0]
  const end = path[path.length - 1]

  for (const p of placements) {
    if (p.path.length !== path.length) continue

    // Direct match (start -> end)
    if (
      p.start.row === start.row &&
      p.start.col === start.col &&
      p.end.row === end.row &&
      p.end.col === end.col
    ) {
      return p.wordId
    }

    // Inverse match (dragged backwards end -> start)
    if (
      p.start.row === end.row &&
      p.start.col === end.col &&
      p.end.row === start.row &&
      p.end.col === start.col
    ) {
      return p.wordId
    }
  }

  return null
}
