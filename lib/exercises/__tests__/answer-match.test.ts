import { describe, expect, it } from 'vitest'
import {
  expandTemplate,
  matchAnswer,
  specFromErrorCorrection,
  specFromTransformation,
  specFromReorder,
  damerauLevenshtein,
} from '../answer-match'
import type { ErrorCorrectionExercise, ReorderWordsExercise, SentenceTransformationExercise } from '../types'

describe('answer-match', () => {
  it('damerauLevenshtein calculates insertion, deletion, substitution, and transposition', () => {
    expect(damerauLevenshtein('techer', 'teacher')).toBe(1) // deletion
    expect(damerauLevenshtein('taecher', 'teacher')).toBe(1) // transposition
    expect(damerauLevenshtein('teachar', 'teacher')).toBe(1) // substitution
    expect(damerauLevenshtein('teacherr', 'teacher')).toBe(1) // insertion
    expect(damerauLevenshtein('teacher', 'teacher')).toBe(0)
    expect(damerauLevenshtein('tc', 'teacher')).toBe(5)
  })

  it('expandTemplate handles combinations and caps at 64', () => {
    const expansions = expandTemplate('{She is|She\'s} a teacher.')
    expect(expansions).toEqual(['She is a teacher.', "She's a teacher."])

    const optionalExp = expandTemplate('I {am|} ready')
    expect(optionalExp).toEqual(['I am ready', 'I  ready'])

    // 2 * 2 * 2 * 2 * 2 * 2 = 64
    const valid64 = '{a|b} {c|d} {e|f} {g|h} {i|j} {k|l}'
    expect(expandTemplate(valid64).length).toBe(64)

    // 65 or more
    const invalid65 = '{a|b|c} {d|e|f} {g|h|i} {j|k|l}' // 3^4 = 81
    expect(() => expandTemplate(invalid65)).toThrow(/exceeded limit of 64/)
  })

  it('handles verification test cases from Plan 043', () => {
    const errorEx: ErrorCorrectionExercise = {
      id: 'test-1',
      type: 'error_correction',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
      sentence: 'She am a teacher.',
      correctSentence: 'She is a teacher.',
    }

    const spec = {
      ...specFromErrorCorrection(errorEx),
      accept: ['{She is|She\'s} a teacher.'],
    }

    // She's a teacher = variant (2nd expansion)
    const resVariant = matchAnswer("She's a teacher", spec)
    expect(resVariant.kind).toBe('variant')
    if (resVariant.kind === 'variant') {
      expect(resVariant.score).toBe(100)
    }

    // she is a teacher! = exact (1st expansion, ignore punctuation)
    const resExact = matchAnswer('she is a teacher!', spec)
    expect(resExact.kind).toBe('exact')

    // She is a techer = typo (teacher is >= 4 chars, not targetToken, Levenshtein = 1)
    const resTypo = matchAnswer('She is a techer', spec)
    expect(resTypo.kind).toBe('typo')
    if (resTypo.kind === 'typo') {
      expect(resTypo.score).toBe(90)
      expect(resTypo.typos).toEqual([{ got: 'techer', expected: 'teacher' }])
    }

    // She are a teacher = no_match (targetToken is 'is')
    const resNoMatch = matchAnswer('She are a teacher', spec)
    expect(resNoMatch.kind).toBe('no_match')

    // Contracción requerida con She is a doctor = contraction_mismatch
    const reqSpec = {
      accept: ["{She's|She is} a doctor."],
      contractions: 'require' as const,
    }
    const resMismatch = matchAnswer('She is a doctor', reqSpec)
    expect(resMismatch.kind).toBe('contraction_mismatch')
    if (resMismatch.kind === 'contraction_mismatch') {
      expect(resMismatch.expectedForm).toBe('contracted')
    }

    // mustInclude: ['wish'] sin wish = missing_required
    const wishSpec = {
      accept: ['I wish I had a car.'],
      mustInclude: ['wish'],
    }
    const resMissing = matchAnswer('I want a car', wishSpec)
    expect(resMissing.kind).toBe('missing_required')
    if (resMissing.kind === 'missing_required') {
      expect(resMissing.missing).toEqual(['wish'])
    }

    // maxTypos: 1 con 2 tipeos = no_match
    // 'techer docter' vs 'teacher doctor'
    const doubleTypoSpec = {
      accept: ['The teacher and doctor are here.'],
    }
    const resDoubleTypo = matchAnswer('The techer and docter are here', doubleTypoSpec, { maxTypos: 1 })
    expect(resDoubleTypo.kind).toBe('no_match')
  })

  it('supports extraAccepted from user saved answers', () => {
    const spec = { accept: ['She is happy.'] }
    const res = matchAnswer('She feels joyful', spec, { extraAccepted: ['She feels joyful'] })
    expect(res.kind).toBe('variant')
    if (res.kind === 'variant') {
      expect(res.score).toBe(100)
    }
  })

  it('detects commonWrong answers', () => {
    const spec = {
      accept: ['He goes to school.'],
      commonWrong: [{ answer: 'He go to school.', feedback: 'Recuerda añadir -s para he/she/it.' }],
    }
    const res = matchAnswer('He go to school', spec)
    expect(res.kind).toBe('known_wrong')
    if (res.kind === 'known_wrong') {
      expect(res.feedback).toBe('Recuerda añadir -s para he/she/it.')
    }
  })

  it('derives targetTokens for transformation and reorder', () => {
    const transEx: SentenceTransformationExercise = {
      id: 'trans-1',
      type: 'sentence_transformation',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
      sourceSentence: 'I do not have a car.',
      instruction: 'Usa wish',
      referenceAnswer: 'I wish I had a car.',
    }
    const transSpec = specFromTransformation(transEx)
    expect(transSpec.accept).toEqual(['I wish I had a car.'])
    expect(transSpec.targetTokens).toContain('wish')

    const reorderEx: ReorderWordsExercise = {
      id: 'reorder-1',
      type: 'reorder_words',
      sourceRef: { source: 'grammar_deck', id: 'deck-1' },
      sentence: 'She is a doctor.',
      tokens: ['is', 'She', 'doctor', 'a'],
    }
    const reorderSpec = specFromReorder(reorderEx)
    expect(reorderSpec.contractions).toBe('forbid')
    expect(reorderSpec.targetTokens).toEqual(['she', 'is', 'a', 'doctor'])
  })
})
