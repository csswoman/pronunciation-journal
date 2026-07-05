import { describe, expect, it } from 'vitest'
import { buildHistory, buildToolConfig, encodeChunk, streamWithFallback } from '../chat-route'

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

  it('streams text deltas and a terminal done event', async () => {
    const ai = {
      chats: {
        create: () => ({
          async *sendMessageStream() {
            yield { candidates: [{ content: { parts: [{ text: 'hello' }] } }] }
          },
        }),
      },
    }

    const stream = new ReadableStream({
      start(controller) {
        return streamWithFallback(
          ai as never,
          'system',
          [],
          'message',
          { toolChoice: 'none' },
          controller,
          new AbortController().signal
        )
      },
    })

    const text = await new Response(stream).text()

    expect(text).toContain('data: {"type":"text_delta","delta":"hello"}')
    expect(text).toContain('data: {"type":"done"}')
  })

  it('streams tool call lifecycle events', async () => {
    const ai = {
      chats: {
        create: () => ({
          async *sendMessageStream() {
            yield {
              candidates: [{
                content: {
                  parts: [{ functionCall: { name: 'save_word', args: { word: 'focus' } } }],
                },
              }],
            }
          },
        }),
      },
    }

    const stream = new ReadableStream({
      start(controller) {
        return streamWithFallback(
          ai as never,
          'system',
          [],
          'message',
          { toolChoice: 'auto', allowedTools: ['save_word'] },
          controller,
          new AbortController().signal
        )
      },
    })

    const text = await new Response(stream).text()

    expect(text).toContain('"type":"tool_call_start"')
    expect(text).toContain('"name":"save_word"')
    expect(text).toContain('"type":"tool_call_args_delta"')
    expect(text).toContain('\\"word\\":\\"focus\\"')
    expect(text).toContain('"type":"tool_call_end"')
  })
})
