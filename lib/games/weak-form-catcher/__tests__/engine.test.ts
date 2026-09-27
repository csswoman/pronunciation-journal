import { describe, it, expect } from 'vitest'
import {
  createInitialWeakFormState,
  weakFormReducer,
} from '../engine'
import type { WeakFormPhraseItem } from '../schema'

const samplePhrase: WeakFormPhraseItem = {
  id: 'wf-1',
  reduced: 'whaddya want',
  full: 'what do you want',
  accept: ['what do you want', 'what dyou want'],
  ipa: '/wʌdʒə wɑːnt/',
  ruleEs: "'what do you' se contrae oralmente a /wʌdʒə/",
}

describe('Weak Form Catcher engine', () => {
  it('starts game with initial phrase', () => {
    let s = createInitialWeakFormState()
    s = weakFormReducer(s, { type: 'start', phrases: [samplePhrase] })

    expect(s.currentPhrase?.reduced).toBe('whaddya want')
    expect(s.status).toBe('playing')
    expect(s.phraseIndex).toBe(0)
  })

  it('rejects typing the exact reduced colloquial form', () => {
    let s = createInitialWeakFormState()
    s = weakFormReducer(s, { type: 'start', phrases: [samplePhrase] })

    s = weakFormReducer(s, { type: 'submit', text: 'whaddya want' })
    expect(s.rejectedReason).toBe('Escribe la forma completa, no la reducida.')
    expect(s.status).toBe('playing')
  })

  it('accepts valid full form or contraction', () => {
    let s = createInitialWeakFormState()
    s = weakFormReducer(s, { type: 'start', phrases: [samplePhrase] })

    s = weakFormReducer(s, { type: 'submit', text: 'what do you want' })
    expect(s.status).toBe('showing_rule')
    expect(s.lastRule?.success).toBe(true)
    expect(s.hits).toBe(1)
    expect(s.score).toBe(150)
  })

  it('limits hint usage to 2 hints per game', () => {
    let s = createInitialWeakFormState()
    s = weakFormReducer(s, { type: 'start', phrases: [samplePhrase] })

    s = weakFormReducer(s, { type: 'use_hint', kind: 'slow' })
    expect(s.hintsUsed).toBe(1)
    expect(s.hintSlowActive).toBe(true)

    s = weakFormReducer(s, { type: 'use_hint', kind: 'first_word' })
    expect(s.hintsUsed).toBe(2)
    expect(s.hintFirstWordActive).toBe(true)

    // Third hint attempt should be ignored
    s = weakFormReducer(s, { type: 'use_hint', kind: 'slow' })
    expect(s.hintsUsed).toBe(2)
  })

  it('tick reaching y >= 100 triggers miss and rule card', () => {
    let s = createInitialWeakFormState()
    s = weakFormReducer(s, { type: 'start', phrases: [samplePhrase] })

    s = weakFormReducer(s, { type: 'tick', dy: 105 })
    expect(s.status).toBe('showing_rule')
    expect(s.lastRule?.success).toBe(false)
    expect(s.misses).toBe(1)
  })
})
