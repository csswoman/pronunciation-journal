import { describe, expect, it } from 'vitest'
import { phonemeTargetId, targetId } from '@/lib/pronunciation/targets/registry'
import { getLearnerTargetCopy, listTargetsMissingLearnerCopy } from '../learner-copy'

describe('learner-copy', () => {
  it('covers every registry target with an explicit learner entry', () => {
    expect(listTargetsMissingLearnerCopy()).toEqual([])
  })

  it('returns Spanish learner titles instead of authoring jargon', () => {
    const schwa = getLearnerTargetCopy(phonemeTargetId('/ə/'))
    expect(schwa.title).toMatch(/vocal relajada/i)
    expect(schwa.ipaHint).toBe('ə')
    expect(schwa.speakCue).toBeTruthy()
  })

  it('explains word stress as syllable force, not regional accent', () => {
    const copy = getLearnerTargetCopy(targetId('prosody.word-stress'))
    expect(copy.title).toMatch(/sílaba tónica/i)
    expect(copy.plainHint).toMatch(/photograph/i)
    expect(copy.plainHint).toMatch(/no es el acento británico/i)
  })
})
