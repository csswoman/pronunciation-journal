import { describe, it, expect } from 'vitest'
import {
  sanitizeWord,
  calculateOptimalGridSize,
  getPathBetween,
  checkWordMatch,
  createWordSearchPuzzle,
} from '../grid-generator'

describe('WordSearch Grid Generator', () => {
  it('sanitizes words correctly', () => {
    expect(sanitizeWord('hello-world!')).toBe('HELLOWORLD')
    expect(sanitizeWord('café')).toBe('CAFE')
    expect(sanitizeWord('   listen   ')).toBe('LISTEN')
  })

  it('calculates reasonable grid sizes', () => {
    expect(calculateOptimalGridSize(['CAT', 'DOG'])).toBeGreaterThanOrEqual(8)
    expect(calculateOptimalGridSize(['EXTRAORDINARY', 'PRONUNCIATION'])).toBeGreaterThanOrEqual(13 > 12 ? 12 : 10)
  })

  it('calculates straight paths correctly', () => {
    // Horizontal path (0,0) -> (0,3)
    const horiz = getPathBetween({ row: 0, col: 0 }, { row: 0, col: 3 })
    expect(horiz).toHaveLength(4)
    expect(horiz).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
      { row: 0, col: 3 },
    ])

    // Diagonal path (1,1) -> (3,3)
    const diag = getPathBetween({ row: 1, col: 1 }, { row: 3, col: 3 })
    expect(diag).toHaveLength(3)
    expect(diag).toEqual([
      { row: 1, col: 1 },
      { row: 2, col: 2 },
      { row: 3, col: 3 },
    ])

    // Invalid non-straight path (0,0) -> (1,3)
    const invalid = getPathBetween({ row: 0, col: 0 }, { row: 1, col: 3 })
    expect(invalid).toEqual([])
  })

  it('generates a playable puzzle with placed words and filled letters', () => {
    const items = [
      { id: '1', word: 'SOUND', displayWord: 'sound', clue: 'Vibrations traveling through air' },
      { id: '2', word: 'VOICE', displayWord: 'voice', clue: 'Sound produced in larynx' },
      { id: '3', word: 'LISTEN', displayWord: 'listen', clue: 'Give one attention to sound' },
    ]

    const puzzle = createWordSearchPuzzle(items, {
      title: 'Sound Basics',
      topic: 'Audio & Speech',
      mode: 'classic',
    })

    expect(puzzle.grid.length).toBe(puzzle.size)
    expect(puzzle.grid[0].length).toBe(puzzle.size)
    expect(puzzle.placements.length).toBe(3)
    expect(puzzle.items.length).toBe(3)

    // Check that all placement letters match what is in the grid
    for (const placement of puzzle.placements) {
      const lettersInGrid = placement.path.map((coord) => puzzle.grid[coord.row][coord.col]).join('')
      expect(lettersInGrid).toBe(placement.word)

      // Test matching detection (forward and reverse)
      const forwardMatch = checkWordMatch(placement.path, puzzle.placements)
      expect(forwardMatch).toBe(placement.wordId)

      const reversedPath = [...placement.path].reverse()
      const reverseMatch = checkWordMatch(reversedPath, puzzle.placements)
      expect(reverseMatch).toBe(placement.wordId)
    }
  })

  it('deduplicates answers after normalization', () => {
    const puzzle = createWordSearchPuzzle([
      { id: '1', word: 'café', displayWord: 'café', clue: 'A drink' },
      { id: '2', word: 'CAFE', displayWord: 'cafe', clue: 'The same answer' },
      { id: '3', word: 'BREAD', displayWord: 'bread', clue: 'Baked food' },
      { id: '4', word: 'SPOON', displayWord: 'spoon', clue: 'A utensil' },
      { id: '5', word: 'PLATE', displayWord: 'plate', clue: 'A dish' },
    ])

    expect(puzzle.items.map((item) => item.word)).toEqual(
      expect.arrayContaining(['CAFE', 'BREAD', 'SPOON', 'PLATE']),
    )
    expect(puzzle.items.filter((item) => item.word === 'CAFE')).toHaveLength(1)
  })

  it('rejects word sets that cannot create a meaningful puzzle', () => {
    expect(() =>
      createWordSearchPuzzle([
        { id: '1', word: 'same', displayWord: 'same', clue: 'First clue' },
        { id: '2', word: 'SAME', displayWord: 'same', clue: 'Duplicate clue' },
        { id: '3', word: 'THISWORDISTOOLONG', displayWord: 'long', clue: 'Too long' },
      ]),
    ).toThrow('Se necesitan al menos 3 palabras distintas')
  })
})
