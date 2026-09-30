import { describe, expect, it } from 'vitest'
import { GrammarStudyDeckSchema } from '../schema'

const base = { cards: [{ id: 'one', tag: 'rule', title: 'Title', lede: '', blocks: [{ type: 'rules', rows: [] }] }],
  quiz: [{ q: 'Question?', options: ['one', 'two'], answer: 0 }] }
describe('authored quiz skills', () => {
  it('preserves per-task listening metadata without inferring grammar', () => {
    const parsed = GrammarStudyDeckSchema.parse({ ...base, quiz: [{ ...base.quiz[0], taskSkill: 'listening' }] })
    expect(parsed.quiz?.[0].taskSkill).toBe('listening')
    expect(parsed.taskSkill).toBeUndefined()
  })
  it('rejects a deck default that contradicts an authored task', () => {
    expect(GrammarStudyDeckSchema.safeParse({ ...base, taskSkill: 'grammar',
      quiz: [{ ...base.quiz[0], taskSkill: 'listening' }] }).success).toBe(false)
  })
  it('leaves unauthored tasks unattributed', () => {
    expect(GrammarStudyDeckSchema.parse(base).quiz?.[0].taskSkill).toBeUndefined()
  })
})
