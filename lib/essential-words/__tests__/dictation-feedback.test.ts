import { describe, expect, it } from 'vitest'
import { buildDictationFeedback, isTargetWordForm, normalizeDictationText, splitDictationIntoParts } from '../dictation-feedback'

describe('dictation feedback', () => {
  it('ignores casing, terminal punctuation, quote style and surrounding/repeated whitespace', () => {
    expect(normalizeDictationText('  “Did   he finish?”  ')).toBe('"did he finish')
    const feedback = buildDictationFeedback('  did   he finish  ', '“Did he finish?”', 'he')
    expect(feedback.hasDifferences).toBe(false)
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
    expect(feedback.targetCorrect).toBe(false)
  })

  it('keeps the item correct when only a non-target word has a typo', () => {
    const feedback = buildDictationFeedback('Did he finish his homework alredy?', 'Did he finish his homework already?', 'he')
    expect(feedback.hasTypos).toBe(true)
    expect(feedback.targetCorrect).toBe(true)
  })

  it('does not classify a valid different target word as a typo', () => {
    const feedback = buildDictationFeedback('I want to he happy.', 'I want to be happy.', 'be', (word) => word === 'he')
    expect(feedback.words).toEqual(expect.arrayContaining([
      expect.objectContaining({ expected: 'be', written: 'he', status: 'error', isTarget: true }),
    ]))
    expect(feedback.targetCorrect).toBe(false)
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
})
