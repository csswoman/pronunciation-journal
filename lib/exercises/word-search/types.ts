export type WordSearchMode = 'classic' | 'clues'
export type WordSearchSource = 'word_bank' | 'gemini' | 'curated' | 'dictionary'

export interface WordSearchItem {
  id: string
  word: string
  displayWord: string
  ipa?: string | null
  clue: string
  meaningEs?: string | null
  exampleSentence?: string | null
  found: boolean
  foundAt?: number // timestamp
}

export interface CellCoordinate {
  row: number
  col: number
}

export interface WordPlacement {
  wordId: string
  word: string
  start: CellCoordinate
  end: CellCoordinate
  direction: [number, number] // [dRow, dCol]
  path: CellCoordinate[]
}

export interface WordSearchPuzzle {
  id: string
  title: string
  topic: string
  source: WordSearchSource
  mode: WordSearchMode
  size: number
  grid: string[][]
  items: WordSearchItem[]
  placements: WordPlacement[]
}

export interface WordSearchThemePreset {
  id: string
  title: string
  description: string
  topicPrompt: string
  level: 'beginner' | 'intermediate' | 'advanced'
  iconName?: string
}
