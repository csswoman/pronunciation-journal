import { describe, expect, it } from 'vitest'
import { DICTATION_DIAGNOSTIC_CONFIG } from '../dictation-diagnostic-config'
import { buildDictationFeedback, dictationAttemptDiagnostic, isTargetWordForm, normalizeDictationText, splitDictationIntoParts } from '../dictation-feedback'

describe('dictation feedback', () => {
  it('ignores casing, terminal punctuation, quote style and surrounding/repeated whitespace', () => {
    expect(normalizeDictationText('  “Did   he finish?”  ')).toBe('"did he finish')
    const feedback = buildDictationFeedback('  did   he finish  ', '“Did he finish?”', 'he')
    expect(feedback.hasDifferences).toBe(false)
    expect(feedback.sentenceCorrect).toBe(true)
    expect(feedback.targetCorrect).toBe(true)
  })

  it('aligns differences with LCS and separates errors from a non-target typo', () => {
    const feedback = buildDictationFeedback(
      'did you finish your homework alredy?',
      'Did he finish his homework already?',
      'he',
      () => false,
    )

    expect(feedback.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'he', written: 'you', status: 'error', isTarget: true }),
      expect.objectContaining({ expected: 'his', written: 'your', status: 'error', isTarget: false }),
      expect.objectContaining({ expected: 'already', written: 'alredy', status: 'typo', isTarget: false }),
    ]))
    expect(feedback.sentenceCorrect).toBe(false)
    expect(feedback.targetCorrect).toBe(false)
  })

  it('keeps the item correct when only a non-target word has a typo', () => {
    const feedback = buildDictationFeedback('Did he finish his homework alredy?', 'Did he finish his homework already?', 'he')
    expect(feedback.hasTypos).toBe(true)
    expect(feedback.sentenceCorrect).toBe(true)
    expect(feedback.targetCorrect).toBe(true)
  })

  it('does not classify a valid different target word as a typo', () => {
    const feedback = buildDictationFeedback('I want to he happy.', 'I want to be happy.', 'be', (word) => word === 'he')
    expect(feedback.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'be', written: 'he', status: 'error', isTarget: true }),
    ]))
    expect(feedback.sentenceCorrect).toBe(false)
    expect(feedback.targetCorrect).toBe(false)
  })

  it('marks the sentence incorrect when a non-target word is replaced by a valid word', () => {
    const feedback = buildDictationFeedback(
      'We walked through the city.',
      'We walked through the park.',
      'through',
      (word) => word === 'city',
    )

    expect(feedback.targetCorrect).toBe(true)
    expect(feedback.sentenceCorrect).toBe(false)
  })

  it('marks regular and common irregular inflections as the target form', () => {
    expect(isTargetWordForm('finishes', 'finish')).toBe(true)
    expect(isTargetWordForm('did', 'do')).toBe(true)
    expect(isTargetWordForm('children', 'child')).toBe(true)
  })

  it('splits audio into short ordered parts', () => {
    expect(splitDictationIntoParts('Did he finish his homework already?')).toEqual([
      'Did he finish', 'his homework already?',
    ])
  })

  it('classifies a missing accent as near-correct orthography evidence', () => {
    const feedback = buildDictationFeedback('I drink cafe.', 'I drink café.', 'café')

    expect(feedback.resultado).toBe('casi')
    expect(feedback.sentenceCorrect).toBe(true)
    expect(feedback.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'café', written: 'cafe', categoria: 'spelling' }),
    ]))
    expect(feedback.evidencia).toEqual(expect.arrayContaining([
      expect.objectContaining({ habilidad: 'production', veredicto: 'fallo' }),
      expect.objectContaining({ habilidad: 'listening', veredicto: 'acierto' }),
    ]))
  })

  it('classifies casing and terminal punctuation-only differences as near-correct', () => {
    expect(buildDictationFeedback('did he finish?', 'Did he finish?', 'he').resultado).toBe('casi')
    expect(buildDictationFeedback('Did he finish', 'Did he finish?', 'he').resultado).toBe('casi')
  })

  it("normalizes curly and straight apostrophes without creating an error", () => {
    const feedback = buildDictationFeedback("I don't know.", "I don’t know.", 'know')
    expect(feedback.resultado).toBe('correcto')
    expect(feedback.hasDifferences).toBe(false)
  })

  it('classifies one- and two-edit misspellings as orthography', () => {
    const oneEdit = buildDictationFeedback('I read thw book.', 'I read the book.', 'the')
    const twoEdits = buildDictationFeedback('I read tax book.', 'I read the book.', 'the')

    expect(oneEdit.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'the', categoria: 'spelling' }),
    ]))
    expect(twoEdits.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'the', categoria: 'spelling' }),
    ]))
  })

  it('classifies an unrecognizable word and an omission as not perceived', () => {
    const unrecognizable = buildDictationFeedback('I read xylophone book.', 'I read the book.', 'the')
    const omission = buildDictationFeedback('I read book.', 'I read the book.', 'the')

    expect(unrecognizable.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'the', categoria: 'guess' }),
    ]))
    expect(omission.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'the', categoria: 'omission' }),
    ]))
  })

  it('classifies an extra word and reordered words without hiding either signal', () => {
    const extra = buildDictationFeedback('I read the short book.', 'I read the book.', 'the')
    const reordered = buildDictationFeedback('I book read the.', 'I read the book.', 'the')

    expect(extra.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ written: 'short', categoria: 'insertion' }),
    ]))
    expect(reordered.palabras).toEqual(expect.arrayContaining([
      expect.objectContaining({ categoria: 'omission' }),
      expect.objectContaining({ categoria: 'insertion' }),
    ]))
  })

  it('diagnoses an empty answer and emits both skill signals for mixed errors', () => {
    const empty = buildDictationFeedback('', 'I read the book.', 'the')
    const mixed = buildDictationFeedback('I raed xylophone book.', 'I read the book.', 'the')

    expect(empty.resultado).toBe('incorrecto')
    expect((empty.palabras ?? []).filter((word) => word.categoria === 'omission')).toHaveLength(4)
    expect(mixed.errorDominante).toBe(DICTATION_DIAGNOSTIC_CONFIG.dominantErrorPriority[0])
    expect(mixed.evidencia).toEqual(expect.arrayContaining([
      expect.objectContaining({ habilidad: 'listening', veredicto: 'acierto' }),
      expect.objectContaining({ habilidad: 'production', veredicto: 'fallo' }),
    ]))
    expect(dictationAttemptDiagnostic(mixed)).toEqual(expect.objectContaining({
      resultado: 'incorrecto',
      palabras: mixed.palabras,
      errorDominante: mixed.errorDominante,
      evidencia: mixed.evidencia,
    }))
  })

  it('does not count a tier-3 omission as listening evidence', () => {
    const tierOne = buildDictationFeedback('I read book.', 'I read the book.', 'the', undefined, undefined, 1)
    const tierThree = buildDictationFeedback('I read book.', 'I read the book.', 'the', undefined, undefined, 3)
    expect(tierOne.evidencia).toContainEqual({ habilidad: 'listening', veredicto: 'fallo' })
    expect(tierThree.evidencia).not.toContainEqual({ habilidad: 'listening', veredicto: 'fallo' })
  })
})
