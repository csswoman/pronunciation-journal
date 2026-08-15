export type MatchResult = Record<string, 'correct' | 'wrong' | null>

type Endpoint = { x: number; y: number }

export type MatchConnection = {
  leftId: string
  rightId: string
  from: Endpoint
  to: Endpoint
  state: 'pending' | 'correct' | 'wrong'
}
