import { describe, expect, it } from 'vitest'
import { resolveModelAudio } from '../model-audio'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

const authored: ScriptLine = {
  id: 'l1', speaker: 'coach', text: 'Hello',
  modelAudio: { path: 'scripts/interview/l1.ogg' },
}
const generated: ScriptLine = { id: 'l2', speaker: 'coach', text: 'Hello' }

describe('resolveModelAudio', () => {
  it('prefiere el audio pregrabado cuando existe', () => {
    const result = resolveModelAudio(authored)
    expect(result.kind).toBe('recorded')
    expect(result.kind === 'recorded' && result.path).toBe('scripts/interview/l1.ogg')
  })

  it('cae a síntesis cuando no hay audio pregrabado', () => {
    const result = resolveModelAudio(generated)
    expect(result.kind).toBe('synthesized')
    expect(result.kind === 'synthesized' && result.text).toBe('Hello')
  })
})
