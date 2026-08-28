import { describe, expect, it } from 'vitest'
import {
  createScriptState,
  recordAttempt,
  advanceLine,
  type ScriptState,
} from '../script-state'
import type { ScriptLine } from '../../types'
import type { SpokenAttempt } from '@/lib/pronunciation/spoken-attempt'

const script: ScriptLine[] = [
  { id: 'l1', speaker: 'coach', text: 'Hello, how are you?' },
  { id: 'l2', speaker: 'learner', text: "I'm doing well, thanks." },
  { id: 'l3', speaker: 'learner', text: 'And you?' },
]

function attempt(score: number, outcome: SpokenAttempt['outcome'] = 'scored'): SpokenAttempt {
  return {
    userId: 'u1', targetText: 'x', transcript: 'x',
    evaluatorVersion: 'test-v1', scoreKind: 'stt_intelligibility',
    overallScore: score, durationMs: 1000, outcome,
  }
}

describe('script-state', () => {
  it('empieza en la primera línea', () => {
    const state = createScriptState('m1', script)
    expect(state.currentIndex).toBe(0)
    expect(state.status).toBe('in_progress')
  })

  it('guarda el mejor intento, no el último', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(80))
    state = recordAttempt(state, attempt(50))
    expect(state.bestByLine.get('l2')?.overallScore).toBe(80)
  })

  it('sustituye el mejor intento cuando mejora', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(50))
    state = recordAttempt(state, attempt(90))
    expect(state.bestByLine.get('l2')?.overallScore).toBe(90)
  })

  it('conserva todos los intentos como evidencia', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(50))
    state = recordAttempt(state, attempt(90))
    expect(state.allAttempts).toHaveLength(2)
  })

  it('nunca deja un intento no puntuado como mejor', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = recordAttempt(state, attempt(0, 'failed'))
    expect(state.bestByLine.has('l2')).toBe(false)
    expect(state.allAttempts).toHaveLength(1)
  })

  it('completa la misión al pasar la última línea', () => {
    let state: ScriptState = createScriptState('m1', script)
    state = advanceLine(state)
    state = advanceLine(state)
    state = advanceLine(state)
    expect(state.status).toBe('completed')
  })

  it('no muta el estado anterior', () => {
    const initial = createScriptState('m1', script)
    const next = advanceLine(initial)
    expect(initial.currentIndex).toBe(0)
    expect(next.currentIndex).toBe(1)
  })
})
