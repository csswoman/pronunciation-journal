import { applyHit, applyMiss, type BaseScoringState } from '@/lib/games/shared/scoring'
import type { MinimalPairItem } from './schema'

export type InvaderShip = {
  id: string
  lane: number
  word: string
  ipa: string
  y: number
  isTarget: boolean
}

export type MissRecord = {
  heard: { word: string; ipa: string }
  chosen: { word: string; ipa: string }
  contrast: string
}

export interface InvadersState extends BaseScoringState {
  ships: InvaderShip[]
  target: { word: string; ipa: string; shipId: string } | null
  targetPair: MinimalPairItem | null
  shields: number
  wave: number
  status: 'playing' | 'game_over'
  lastMissFlash: MissRecord | null
  laneCount: number
  missHistory: MissRecord[]
  hitHistory: Array<{ contrast: string }>
}

export type InvadersAction =
  | { type: 'spawn'; pair: MinimalPairItem; targetSide: 'a' | 'b'; lanes: number }
  | { type: 'tick'; dy: number }
  | { type: 'shoot'; shipId: string }
  | { type: 'clear_flash' }

export function createInitialInvadersState(): InvadersState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    ships: [],
    target: null,
    targetPair: null,
    shields: 3,
    wave: 1,
    status: 'playing',
    lastMissFlash: null,
    laneCount: 2,
    missHistory: [],
    hitHistory: [],
  }
}

export function invadersReducer(state: InvadersState, action: InvadersAction): InvadersState {
  if (state.status === 'game_over') return state

  switch (action.type) {
    case 'clear_flash':
      return { ...state, lastMissFlash: null }

    case 'spawn': {
      const { pair, targetSide, lanes } = action
      const isA = targetSide === 'a'
      const targetWord = isA ? pair.wordA : pair.wordB
      const targetIpa = isA ? pair.ipaA : pair.ipaB
      const distractorWord = isA ? pair.wordB : pair.wordA
      const distractorIpa = isA ? pair.ipaB : pair.ipaA

      const targetLane = Math.floor(Math.random() * lanes)
      const distractorLane = (targetLane + 1 + Math.floor(Math.random() * (lanes - 1))) % lanes

      const targetShipId = `ship-${Date.now()}-target`
      const distractorShipId = `ship-${Date.now()}-distractor`

      const targetShip: InvaderShip = {
        id: targetShipId,
        lane: targetLane,
        word: targetWord,
        ipa: targetIpa,
        y: 0,
        isTarget: true,
      }

      const distractorShip: InvaderShip = {
        id: distractorShipId,
        lane: distractorLane,
        word: distractorWord,
        ipa: distractorIpa,
        y: 0,
        isTarget: false,
      }

      return {
        ...state,
        ships: [targetShip, distractorShip],
        target: { word: targetWord, ipa: targetIpa, shipId: targetShipId },
        targetPair: pair,
        laneCount: lanes,
      }
    }

    case 'tick': {
      if (state.ships.length === 0) return state

      const updatedShips = state.ships.map((ship) => ({
        ...ship,
        y: ship.y + action.dy,
      }))

      const targetShip = updatedShips.find((s) => s.isTarget)
      if (targetShip && targetShip.y >= 100) {
        const missRecord: MissRecord = {
          heard: { word: targetShip.word, ipa: targetShip.ipa },
          chosen: { word: 'Tiempo agotado', ipa: '-' },
          contrast: state.targetPair?.contrast ?? '',
        }
        const newShields = state.shields - 1
        const missState = applyMiss(state)

        return {
          ...missState,
          ships: [],
          target: null,
          targetPair: null,
          shields: newShields,
          status: newShields <= 0 ? 'game_over' : 'playing',
          lastMissFlash: missRecord,
          missHistory: [...state.missHistory, missRecord],
        }
      }

      const validShips = updatedShips.filter((s) => s.y < 100 || s.isTarget)

      return {
        ...state,
        ships: validShips,
      }
    }

    case 'shoot': {
      const shotShip = state.ships.find((s) => s.id === action.shipId)
      if (!shotShip || !state.target) return state

      if (shotShip.isTarget) {
        const hitState = applyHit(state, 100)
        const newHits = hitState.hits
        const nextWave = Math.floor(newHits / 10) + 1
        const nextLanes = Math.min(4, 2 + Math.floor((nextWave - 1) / 2))

        return {
          ...hitState,
          ships: [],
          target: null,
          targetPair: null,
          wave: nextWave,
          laneCount: nextLanes,
          hitHistory: [...state.hitHistory, { contrast: state.targetPair?.contrast ?? '' }],
        }
      } else {
        const missRecord: MissRecord = {
          heard: { word: state.target.word, ipa: state.target.ipa },
          chosen: { word: shotShip.word, ipa: shotShip.ipa },
          contrast: state.targetPair?.contrast ?? '',
        }
        const newShields = state.shields - 1
        const missState = applyMiss(state)

        return {
          ...missState,
          ships: [],
          target: null,
          targetPair: null,
          shields: newShields,
          status: newShields <= 0 ? 'game_over' : 'playing',
          lastMissFlash: missRecord,
          missHistory: [...state.missHistory, missRecord],
        }
      }
    }
  }
}
