import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildCapabilitySnapshot,
  canEvaluateProduction,
  deriveBrowserSupport,
  deriveSttAvailable,
  detectSpeechRecognitionSupport,
  queryMicPermission,
} from '../capability'
import { CapabilitySnapshotSchema } from '../types'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('detectSpeechRecognitionSupport', () => {
  it('detects SpeechRecognition on window', () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    expect(detectSpeechRecognitionSupport()).toBe(true)
  })

  it('detects webkitSpeechRecognition on window', () => {
    vi.stubGlobal('window', { webkitSpeechRecognition: function () {} })
    expect(detectSpeechRecognitionSupport()).toBe(true)
  })

  it('returns false when neither API is present (unsupported browser)', () => {
    vi.stubGlobal('window', {})
    expect(detectSpeechRecognitionSupport()).toBe(false)
  })
})

describe('queryMicPermission', () => {
  it('returns granted/denied/prompt from the Permissions API', async () => {
    vi.stubGlobal('navigator', {
      permissions: { query: vi.fn().mockResolvedValue({ state: 'denied' }) },
    })
    expect(await queryMicPermission()).toBe('denied')
  })

  it('returns unknown when Permissions API is unavailable', async () => {
    vi.stubGlobal('navigator', {})
    expect(await queryMicPermission()).toBe('unknown')
  })

  it('returns unknown when the query rejects', async () => {
    vi.stubGlobal('navigator', {
      permissions: { query: vi.fn().mockRejectedValue(new Error('nope')) },
    })
    expect(await queryMicPermission()).toBe('unknown')
  })
})

describe('deriveBrowserSupport', () => {
  it('is unsupported when there is no SpeechRecognition API', () => {
    expect(deriveBrowserSupport(false, 'unknown')).toBe('unsupported')
  })

  it('is partial when the API exists but mic permission is denied', () => {
    expect(deriveBrowserSupport(true, 'denied')).toBe('partial')
  })

  it('is full when the API exists and mic is not denied', () => {
    expect(deriveBrowserSupport(true, 'granted')).toBe('full')
    expect(deriveBrowserSupport(true, 'unknown')).toBe('full')
  })
})

describe('deriveSttAvailable', () => {
  it('is false when unsupported', () => {
    expect(deriveSttAvailable(false, 'unknown', true)).toBe(false)
  })

  it('is false when mic permission denied', () => {
    expect(deriveSttAvailable(true, 'denied', true)).toBe(false)
  })

  it('is false when offline (conservative: Web Speech API needs network)', () => {
    expect(deriveSttAvailable(true, 'granted', false)).toBe(false)
  })

  it('is true when supported, mic not denied, and online', () => {
    expect(deriveSttAvailable(true, 'granted', true)).toBe(true)
    expect(deriveSttAvailable(true, 'unknown', true)).toBe(true)
  })
})

describe('buildCapabilitySnapshot', () => {
  it('produces a snapshot matching CapabilitySnapshotSchema — supported/online path', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal('navigator', {
      onLine: true,
      permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
    })

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot).toMatchObject({
      micPermission: 'granted',
      sttAvailable: true,
      browserSupport: 'full',
    })
  })

  it('produces a snapshot for permission-denied path', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal('navigator', {
      onLine: true,
      permissions: { query: vi.fn().mockResolvedValue({ state: 'denied' }) },
    })

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot).toMatchObject({
      micPermission: 'denied',
      sttAvailable: false,
      browserSupport: 'partial',
    })
    expect(canEvaluateProduction(snapshot)).toBe(false)
  })

  it('produces a snapshot for unsupported-browser path', async () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('navigator', { onLine: true })

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot).toMatchObject({
      sttAvailable: false,
      browserSupport: 'unsupported',
    })
    expect(canEvaluateProduction(snapshot)).toBe(false)
  })

  it('produces a snapshot for offline path (sttAvailable forced false)', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal('navigator', {
      onLine: false,
      permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
    })

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot.sttAvailable).toBe(false)
    expect(canEvaluateProduction(snapshot)).toBe(false)
  })

  it('produces a snapshot for evaluator-unavailable path (API present, permission unknown, but treated as evaluator down)', async () => {
    vi.stubGlobal('window', { webkitSpeechRecognition: function () {} })
    vi.stubGlobal('navigator', {
      onLine: true,
      permissions: undefined,
    })

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot.micPermission).toBe('unknown')
    expect(snapshot.sttAvailable).toBe(true)
    expect(snapshot.browserSupport).toBe('full')
  })
})

describe('canEvaluateProduction', () => {
  it('is true only when sttAvailable, supported, and mic not denied', () => {
    expect(
      canEvaluateProduction({
        micPermission: 'granted',
        sttAvailable: true,
        browserSupport: 'full',
        capturedAt: new Date().toISOString(),
      })
    ).toBe(true)
  })
})
