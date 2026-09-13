// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSpeechInputAdapter,
  detectSpeechAdapterKind,
} from '../adapters/selector'
import {
  WebSpeechAdapter,
  canScoreSpeech,
  isWebSpeechReliable,
} from '../adapters/webSpeechAdapter'
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

  it('routes mobile Chrome on Android to gemini despite a Chrome user agent', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      configurable: true,
    })
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('auto')).toBe('gemini')
    const adapter = createSpeechInputAdapter({ prefer: 'auto' })
    expect(adapter).toBeInstanceOf(GeminiAdapter)
  })

  it('routes Chrome on iOS (CriOS) to gemini', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1',
      configurable: true,
    })
    ;(window as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('auto')).toBe('gemini')
  })

  it('routes an iPad reporting a desktop user agent to gemini via touch points', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', {
      value: { getUserMedia: vi.fn() },
      configurable: true,
    })

    expect(detectSpeechAdapterKind('auto')).toBe('gemini')
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
  })

  it('still allows an explicit web-speech preference on mobile', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      configurable: true,
    })
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}

    expect(detectSpeechAdapterKind('web-speech')).toBe('web-speech')
  })

  it('falls back to web-speech on mobile when no microphone API exists', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      configurable: true,
    })
    ;(window as { SpeechRecognition?: unknown }).SpeechRecognition = function () {}
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })

    expect(detectSpeechAdapterKind('auto')).toBe('web-speech')
  })
})

describe('canScoreSpeech', () => {
  const originalUserAgent = navigator.userAgent

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      configurable: true,
    })
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
  })

  const originalMediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')

  afterEach(() => {
    if (originalMediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', originalMediaDevices)
    }
  })

  it('is true on mobile, where the Gemini adapter does the scoring', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      configurable: true,
    })
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia() {} }, configurable: true })

    expect(isWebSpeechReliable()).toBe(false)
    expect(canScoreSpeech()).toBe(true)
  })

  it('is true on desktop Chrome', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      configurable: true,
    })
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia() {} }, configurable: true })

    expect(canScoreSpeech()).toBe(true)
  })

  // Brave/Edge/Firefox/Safari lack a usable native recognizer, but the Gemini
  // adapter records and transcribes the audio itself, so scoring still works.
  it('is true on desktop browsers without a native recognizer, via Gemini', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      configurable: true,
    })
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia() {} }, configurable: true })

    expect(isWebSpeechReliable()).toBe(false)
    expect(canScoreSpeech()).toBe(true)
  })

  // The real blocker is an unreachable microphone (insecure origin, blocked
  // permission, no device) — not the browser brand.
  it('is false when no microphone is reachable and Web Speech is unusable', () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      configurable: true,
    })
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })

    expect(canScoreSpeech()).toBe(false)
  })
})
