import { describe, expect, it } from 'vitest'
import { scaffoldScript } from '../scaffold'
import type { ScriptedMission } from '../../types'
import { phonemeTargetId } from '@/lib/pronunciation/targets/registry'

const targetId = phonemeTargetId('/iː/')
const mission: ScriptedMission = {
  id: 'scripted.test', mode: 'scripted', origin: 'authored', category: 'service',
  recommendedCefr: 'A2', context: 'Contexto', communicativeGoal: 'Meta',
  targets: [{ targetId, phrase: 'tea' }],
  script: [
    { id: 'coach-1', speaker: 'coach', text: 'Hello.' },
    { id: 'learner-1', speaker: 'learner', text: 'Hi.' },
    { id: 'coach-2', speaker: 'coach', text: 'What would you like?' },
    { id: 'learner-2', speaker: 'learner', text: 'Tea, please.', targetId },
    { id: 'coach-3', speaker: 'coach', text: 'Anything else?' },
    { id: 'learner-3', speaker: 'learner', text: 'No, thanks.' },
  ],
}

describe('scaffoldScript', () => {
  it('keeps only the prompt and learner line for the requested target', () => {
    expect(scaffoldScript(mission, [targetId]).map((line) => line.id)).toEqual(['coach-2', 'learner-2'])
  })

  it('finds the authored target phrase when an older script has no line target', () => {
    expect(scaffoldScript({ ...mission, script: mission.script.map((line) => ({ ...line, targetId: undefined })) }, [targetId])
      .map((line) => line.id)).toEqual(['coach-2', 'learner-2'])
  })

  it('uses the first learner turn only when no authored target line is available', () => {
    const withoutTargetPhrase = {
      ...mission,
      script: mission.script.map((line) => ({ ...line, targetId: undefined, text: line.text.replace('Tea, please.', 'Something else.') })),
    }
    expect(scaffoldScript(withoutTargetPhrase, [targetId]).map((line) => line.id)).toEqual(['coach-1', 'learner-1'])
  })
})
