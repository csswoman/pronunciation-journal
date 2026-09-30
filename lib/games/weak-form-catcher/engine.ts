import { applyHit, applyMiss, type BaseScoringState } from '@/lib/games/shared/scoring'
import type { WeakFormPhraseItem } from './schema'
import { matchAnswer, normalize } from '@/lib/exercises/answer-match'

export type WeakFormMissRecord = {
  phrase: WeakFormPhraseItem
  userAnswer: string
}

/** A game ends after this many missed phrases. */
export const WEAK_FORM_MAX_MISSES = 3

export interface WeakFormState extends BaseScoringState {
  queue: WeakFormPhraseItem[]
  currentPhrase: WeakFormPhraseItem | null
  phraseIndex: number
  totalPhrases: number
  y: number
  hintsUsed: number
  hintSlowActive: boolean
  hintFirstWordActive: boolean
  status: 'playing' | 'showing_rule' | 'game_over'
  lastRule: { phrase: WeakFormPhraseItem; success: boolean } | null
  missHistory: WeakFormMissRecord[]
  rejectedReason: string | null
}

export type WeakFormAction =
  | { type: 'start'; phrases: WeakFormPhraseItem[] }
  | { type: 'tick'; dy: number }
  | { type: 'submit'; text: string }
  | { type: 'use_hint'; kind: 'slow' | 'first_word' }
  | { type: 'dismiss_rule' }
  | { type: 'clear_rejection' }

export function createInitialWeakFormState(): WeakFormState {
  return {
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    queue: [],
    currentPhrase: null,
    phraseIndex: 0,
    totalPhrases: 0,
    y: 0,
    hintsUsed: 0,
    hintSlowActive: false,
    hintFirstWordActive: false,
    status: 'playing',
    lastRule: null,
    missHistory: [],
    rejectedReason: null,
  }
}

export function weakFormReducer(state: WeakFormState, action: WeakFormAction): WeakFormState {
  if (state.status === 'game_over' && action.type !== 'start') return state

  switch (action.type) {
    case 'clear_rejection':
      return { ...state, rejectedReason: null }

    case 'start': {
      if (action.phrases.length === 0) {
        return { ...state, status: 'game_over' }
      }
      return {
        ...createInitialWeakFormState(),
        queue: action.phrases,
        currentPhrase: action.phrases[0],
        phraseIndex: 0,
        totalPhrases: action.phrases.length,
        status: 'playing',
      }
    }

    case 'use_hint': {
      if (state.hintsUsed >= 2 || !state.currentPhrase) return state
      if (action.kind === 'slow' && state.hintSlowActive) return state
      if (action.kind === 'first_word' && state.hintFirstWordActive) return state

      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        hintSlowActive: action.kind === 'slow' ? true : state.hintSlowActive,
        hintFirstWordActive: action.kind === 'first_word' ? true : state.hintFirstWordActive,
      }
    }

    case 'tick': {
      if (state.status !== 'playing' || !state.currentPhrase) return state

      const newY = state.y + action.dy
      if (newY >= 100) {
        const missState = applyMiss(state)
        const missRecord: WeakFormMissRecord = {
          phrase: state.currentPhrase,
          userAnswer: 'Tiempo agotado',
        }

        return {
          ...missState,
          y: 0,
          status: 'showing_rule',
          lastRule: { phrase: state.currentPhrase, success: false },
          missHistory: [...state.missHistory, missRecord],
          hintSlowActive: false,
          hintFirstWordActive: false,
        }
      }

      return { ...state, y: newY }
    }

    case 'submit': {
      if (state.status !== 'playing' || !state.currentPhrase) return state

      const userNorm = normalize(action.text)
      const reducedNorm = normalize(state.currentPhrase.reduced)

      if (userNorm === reducedNorm) {
        return {
          ...state,
          rejectedReason: 'Escribe la forma completa, no la reducida.',
        }
      }

      const acceptList = [state.currentPhrase.full, ...(state.currentPhrase.accept ?? [])]
      const verdict = matchAnswer(action.text, { accept: acceptList })

      const isCorrect = verdict.kind === 'exact' || verdict.kind === 'variant' || verdict.kind === 'typo'

      if (isCorrect) {
        const hitState = applyHit(state, 150)
        return {
          ...hitState,
          y: 0,
          status: 'showing_rule',
          lastRule: { phrase: state.currentPhrase, success: true },
          rejectedReason: null,
          hintSlowActive: false,
          hintFirstWordActive: false,
        }
      } else {
        const missState = applyMiss(state)
        const missRecord: WeakFormMissRecord = {
          phrase: state.currentPhrase,
          userAnswer: action.text,
        }
        return {
          ...missState,
          y: 0,
          status: 'showing_rule',
          lastRule: { phrase: state.currentPhrase, success: false },
          missHistory: [...state.missHistory, missRecord],
          rejectedReason: null,
          hintSlowActive: false,
          hintFirstWordActive: false,
        }
      }
    }

    case 'dismiss_rule': {
      const nextIndex = state.phraseIndex + 1
      const isFinished = nextIndex >= state.totalPhrases
      if (isFinished || state.misses >= WEAK_FORM_MAX_MISSES) {
        return { ...state, status: 'game_over', lastRule: null }
      }

      return {
        ...state,
        status: 'playing',
        phraseIndex: nextIndex,
        currentPhrase: state.queue[nextIndex] ?? null,
        lastRule: null,
        y: 0,
      }
    }
  }
}
