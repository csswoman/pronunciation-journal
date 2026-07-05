import { describe, expect, it } from 'vitest'
import { buildHistory, buildToolConfig, encodeChunk } from '../chat-route'

describe('gemini chat-route helpers', () => {
  it('maps plain and tool messages into Gemini history content', () => {
    const history = buildHistory([
      { role: 'user', content: 'hello' },
      { role: 'model', content: 'hi' },
      { role: 'tool', name: 'save_word', result: { ok: true } },
    ])

    expect(history).toEqual([
      { role: 'user', parts: [{ text: 'hello' }] },
      { role: 'model', parts: [{ text: 'hi' }] },
      {
        role: 'user',
        parts: [{ functionResponse: { name: 'save_word', response: { result: { ok: true } } } }],
      },
    ])
  })

  it('builds restrictive tool config for none, any, and auto modes', () => {
    expect(buildToolConfig('none', ['save_word'])).toEqual({
      functionCallingConfig: { mode: 'NONE' },
    })
    expect(buildToolConfig('any', ['render_word_card'])).toEqual({
      functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['render_word_card'] },
    })
    expect(buildToolConfig('auto', [])).toEqual({
      functionCallingConfig: { mode: 'AUTO' },
    })
  })

  it('encodes server-sent event chunks consistently', () => {
    const encoded = new TextDecoder().decode(encodeChunk({ type: 'done' }))

    expect(encoded).toBe('data: {"type":"done"}\n\n')
  })
})
