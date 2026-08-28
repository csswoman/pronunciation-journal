// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSpeechInputAdapter,
  detectSpeechAdapterKind,
} from '../adapters/selector'
import { WebSpeechAdapter } from '../adapters/webSpeechAdapter'
import { GeminiAdapter } from '../adapters/geminiAdapter'

describe('speech adapter selector', () => {
  const originalMediaDevices = navigator.mediaDevices
  const originalUserAgent = navigator.userAgent

  beforeEach(() => {
    delete (window as { SpeechRecognition?: unknown }).SpeechRecognition
    delete (window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    Object.defineProperty(navigator, 'mediaDevices', {
      value: originalMediaDevices,
      configurable: true,
    })
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
  })

  it('detects web-speech when in real Chrome with SpeechRecognition', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    })
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('auto')).toBe('web-speech')
    const adapter = createSpeechInputAdapter({ prefer: 'auto' })
    expect(adapter).toBeInstanceOf(WebSpeechAdapter)
  })

  it('detects gemini in non-Chrome browsers (Edge/Brave/Firefox/Safari) when microphone is available', () => {
    // Edge user agent
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      configurable: true,
    })
    ;(window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('auto')).toBe('gemini')
    const adapter = createSpeechInputAdapter({ prefer: 'auto' })
    expect(adapter).toBeInstanceOf(GeminiAdapter)
  })

  it('honors explicit prefer: "gemini"', () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('gemini')).toBe('gemini')
    const adapter = createSpeechInputAdapter({ prefer: 'gemini' })
    expect(adapter).toBeInstanceOf(GeminiAdapter)
  })

  it('honors explicit prefer: "web-speech" if supported', () => {
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
    expect(detectSpeechAdapterKind('web-speech')).toBe('web-speech')
    const adapter = createSpeechInputAdapter({ prefer: 'web-speech' })
    expect(adapter).toBeInstanceOf(WebSpeechAdapter)
  })
})
