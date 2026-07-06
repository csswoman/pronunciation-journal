import { describe, expect, it, vi } from 'vitest'
import { buildHistory, buildToolConfig, encodeChunk, streamWithFallback } from '../chat-route'

async function readStream(run: (controller: ReadableStreamDefaultController) => unknown): Promise<string> {
  const stream = new ReadableStream({
    start(controller) {
      return run(controller)
    },
  })
  return new Response(stream).text()
}

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

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'none' },
      controller,
      new AbortController().signal
    ))

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

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'auto', allowedTools: ['save_word'] },
      controller,
      new AbortController().signal
    ))

    expect(text).toContain('"type":"tool_call_start"')
    expect(text).toContain('"name":"save_word"')
    expect(text).toContain('"type":"tool_call_args_delta"')
    expect(text).toContain('\\"word\\":\\"focus\\"')
    expect(text).toContain('"type":"tool_call_end"')
  })

  it('truncates streams that exceed the chunk limit', async () => {
    const ai = {
      chats: {
        create: () => ({
          async *sendMessageStream() {
            yield { candidates: [{ content: { parts: [{ text: 'one' }] } }] }
            yield { candidates: [{ content: { parts: [{ text: 'two' }] } }] }
          },
        }),
      },
    }

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'none' },
      controller,
      new AbortController().signal,
      { maxChunks: 1 }
    ))

    expect(text).toContain('"delta":"one"')
    expect(text).toContain('"truncated":true')
    expect(text).not.toContain('"delta":"two"')
  })

  it('truncates streams that exceed the byte limit', async () => {
    const ai = {
      chats: {
        create: () => ({
          async *sendMessageStream() {
            yield { candidates: [{ content: { parts: [{ text: 'a long stream chunk' }] } }] }
          },
        }),
      },
    }

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'none' },
      controller,
      new AbortController().signal,
      { maxBytes: 5 }
    ))

    expect(text).toBe('data: {"type":"done","truncated":true}\n\n')
  })

  it('tries the next stream model after a retryable failure', async () => {
    const create = vi.fn()
      .mockReturnValueOnce({
        sendMessageStream: () => {
          throw { status: 429, message: 'rate limited' }
        },
      })
      .mockReturnValueOnce({
        async *sendMessageStream() {
          yield { candidates: [{ content: { parts: [{ text: 'fallback' }] } }] }
        },
      })
    const ai = { chats: { create } }

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'none' },
      controller,
      new AbortController().signal
    ))

    expect(create).toHaveBeenCalledTimes(2)
    expect(text).toContain('"delta":"fallback"')
    expect(text).toContain('"type":"done"')
  })

  it('closes cleanly without error chunks when aborted before streaming', async () => {
    const abortController = new AbortController()
    abortController.abort()
    const create = vi.fn()
    const ai = { chats: { create } }

    const text = await readStream((controller) => streamWithFallback(
      ai as never,
      'system',
      [],
      'message',
      { toolChoice: 'none' },
      controller,
      abortController.signal
    ))

    expect(create).not.toHaveBeenCalled()
    expect(text).toBe('')
  })
})
