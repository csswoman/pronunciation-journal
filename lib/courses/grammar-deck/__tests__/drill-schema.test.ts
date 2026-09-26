import { describe, it, expect } from 'vitest'
import { GrammarDrillSchema } from '../drill-schema'

describe('GrammarDrillSchema superRefine validations', () => {
  const validA1Drill = {
    level: 'A1' as const,
    reviewed: true,
    transform: [
      { source: 'I am happy.', instruction: 'Usa contracción', accept: ["I'm happy."], contractions: 'require' as const },
      { source: 'You are late.', instruction: 'Usa contracción', accept: ["You're late."], contractions: 'require' as const },
      { source: 'They are here.', instruction: 'Usa contracción', accept: ["They're here."], contractions: 'require' as const },
    ],
    build: [
      { kind: 'reorder' as const, accept: ['I am a student.'] },
      { kind: 'reorder' as const, accept: ['She is at home.'] },
      { kind: 'reorder' as const, accept: ['We are in Madrid.'] },
    ],
    correct: [
      { sentence: 'I are from Mexico.', accept: ['{I am|I\'m} from Mexico.'], explanation: 'Con I se usa am.' },
      { sentence: 'She are my friend.', accept: ['{She is|She\'s} my friend.'], explanation: 'Con she se usa is.' },
      { sentence: 'They is ready.', accept: ['{They are|They\'re} ready.'], explanation: 'Con they se usa are.' },
    ],
    personalize: [
      { mode: 'frame' as const, frame: "I'm ___ years old.", slot: 'number' as const },
      { mode: 'frame' as const, frame: "I'm from ___.", slot: 'word' as const },
      { mode: 'frame' as const, frame: "Right now, I'm ___.", slot: 'phrase' as const },
    ],
  }

  it('passes a fully valid A1 drill', () => {
    const result = GrammarDrillSchema.safeParse(validA1Drill)
    expect(result.success).toBe(true)
  })

  it('rejects techniques with fewer than 3 items', () => {
    const invalid = {
      ...validA1Drill,
      transform: [
        { source: 'I am happy.', instruction: 'Usa contracción', accept: ["I'm happy."] },
        { source: 'You are late.', instruction: 'Usa contracción', accept: ["You're late."] },
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('entre 3 y 5 ítems'))).toBe(true)
    }
  })

  it('rejects templates exceeding 64 expansions', () => {
    // 7 binary choices = 2^7 = 128 expansions
    const tooMany = '{a|b} {c|d} {e|f} {g|h} {i|j} {k|l} {m|n}'
    const invalid = {
      ...validA1Drill,
      transform: [
        { source: 'X', instruction: 'Y', accept: [tooMany] },
        validA1Drill.transform[1],
        validA1Drill.transform[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('excede 64 expansiones'))).toBe(true)
    }
  })

  it('rejects transform when source sentence is accepted by accept spec', () => {
    const invalid = {
      ...validA1Drill,
      transform: [
        { source: 'I am happy.', instruction: 'Reescribe', accept: ['I am happy.'] },
        validA1Drill.transform[1],
        validA1Drill.transform[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('oración original no puede'))).toBe(true)
    }
  })

  it('rejects mustInclude when a word is missing in an expansion', () => {
    const invalid = {
      ...validA1Drill,
      transform: [
        { source: 'It is bad.', instruction: 'Use wish', accept: ['I want it to change.'], mustInclude: ['wish'] },
        validA1Drill.transform[1],
        validA1Drill.transform[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('mustInclude "wish" falta'))).toBe(true)
    }
  })

  it('rejects commonWrong when it matches an accept expansion', () => {
    const invalid = {
      ...validA1Drill,
      correct: [
        {
          sentence: 'I is ready.',
          accept: ['I am ready.'],
          commonWrong: [{ answer: 'I am ready.', feedback: 'Should not collide' }],
        },
        validA1Drill.correct[1],
        validA1Drill.correct[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('commonWrong coincide'))).toBe(true)
    }
  })

  it('rejects correct exercise when error sentence is approved by accept', () => {
    const invalid = {
      ...validA1Drill,
      correct: [
        { sentence: 'I am from Mexico.', accept: ['I am from Mexico.'] }, // without alreadyCorrect: true, error sentence cannot match accept
        validA1Drill.correct[1],
        validA1Drill.correct[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('Oración errónea fue aceptada'))).toBe(true)
    }
  })

  it('rejects higher level structures in low level drills', () => {
    const invalid = {
      ...validA1Drill,
      transform: [
        {
          source: 'Never had I seen such beauty.',
          instruction: 'Use inversion',
          accept: ['Never had I seen such beauty.'],
          requires: ['negative_inversion' as const],
        },
        validA1Drill.transform[1],
        validA1Drill.transform[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('excede el nivel del drill'))).toBe(true)
    }
  })

  it('rejects combine technique in A1 (buildMode is reorder)', () => {
    const invalid = {
      ...validA1Drill,
      build: [
        { kind: 'combine' as const, sources: ['I am tired.', 'I go to bed.'], accept: ['I am tired so I go to bed.'] },
        validA1Drill.build[1],
        validA1Drill.build[2],
      ],
    }
    const result = GrammarDrillSchema.safeParse(invalid)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message.includes('combine no permitida en nivel A1'))).toBe(true)
    }
  })
})
