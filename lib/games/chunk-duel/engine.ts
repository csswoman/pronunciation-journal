import { applyHit, applyMiss, type BaseScoringState } from '@/lib/games/shared/scoring'
import type { ChunkDuelItem } from './schema'
import type { RoundSpec } from './tokenizer'

export type DuelMissRecord = {
  chunk: ChunkDuelItem
  userPicked: string[]
  expected: string[]
}

export interface DuelState extends BaseScoringState {
  currentRound: RoundSpec | null
  roundIndex: number
  totalRounds: number
  selectedTileIds: string[]
  ghostProgress: number // 0 to 100
  ghostSpeed: number
  roundWon: boolean | null
  status: 'playing' | 'round_result' | 'game_over'
  missHistory: DuelMissRecord[]
  shakeTileId: string | null
}

export type DuelAction =
  | { type: 'start_round'; round: RoundSpec; totalRounds: number; roundIndex: number; ghostSpeed: number }
  | { type: 'pick_tile'; tileId: string }
  | { type: 'tick'; dt: number }
  | { type: 'next_round' }
  | { type: 'clear_shake' }
  | { type: 'finish' }
  | { type: 'reset' }

export function createInitialDuelState(): DuelState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    currentRound: null,
    roundIndex: 0,
    totalRounds: 0,
    selectedTileIds: [],
    ghostProgress: 0,
    ghostSpeed: 0.05,
    roundWon: null,
    status: 'playing',
    missHistory: [],
    shakeTileId: null,
  }
}

export function duelReducer(state: DuelState, action: DuelAction): DuelState {
  if (action.type === 'reset') return createInitialDuelState()
  if (state.status === 'game_over') return state

  switch (action.type) {
    case 'clear_shake':
      return { ...state, shakeTileId: null }

    case 'finish':
      return { ...state, status: 'game_over' }

    case 'start_round': {
      return {
        ...state,
        currentRound: action.round,
        roundIndex: action.roundIndex,
        totalRounds: action.totalRounds,
        ghostSpeed: action.ghostSpeed,
        ghostProgress: 0,
        selectedTileIds: [],
        roundWon: null,
        status: 'playing',
        shakeTileId: null,
      }
    }

    case 'tick': {
      if (state.status !== 'playing' || !state.currentRound) return state

      const newGhost = state.ghostProgress + action.dt * state.ghostSpeed
      if (newGhost >= 100) {
        // Ghost won round!
        const missRecord: DuelMissRecord = {
          chunk: state.currentRound.chunkItem,
          userPicked: state.selectedTileIds.map(
            (id) => state.currentRound!.tiles.find((t) => t.id === id)?.text ?? '',
          ),
          expected: state.currentRound.solutionTokens,
        }
        const missState = applyMiss(state)

        return {
          ...missState,
          ghostProgress: 100,
          roundWon: false,
          status: 'round_result',
          missHistory: [...state.missHistory, missRecord],
        }
      }

      return { ...state, ghostProgress: newGhost }
    }

    case 'pick_tile': {
      if (state.status !== 'playing' || !state.currentRound) return state
      const { tiles, solutionTokens } = state.currentRound

      const pickedTile = tiles.find((t) => t.id === action.tileId)
      if (!pickedTile) return state

      const currentStep = state.selectedTileIds.length
      const expectedToken = solutionTokens[currentStep]

      if (pickedTile.isSolution && pickedTile.text === expectedToken) {
        // Correct tile picked in order!
        const nextSelected = [...state.selectedTileIds, pickedTile.id]

        if (nextSelected.length === solutionTokens.length) {
          // Round completed!
          const hitState = applyHit(state, 200)
          return {
            ...hitState,
            selectedTileIds: nextSelected,
            roundWon: true,
            status: 'round_result',
            shakeTileId: null,
          }
        }

        return {
          ...state,
          selectedTileIds: nextSelected,
          shakeTileId: null,
        }
      } else {
        // Wrong tile! Shake tile and small penalty
        return {
          ...state,
          shakeTileId: action.tileId,
        }
      }
    }

    case 'next_round': {
      return state
    }
  }
}
