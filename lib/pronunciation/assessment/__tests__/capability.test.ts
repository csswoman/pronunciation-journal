import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildCapabilitySnapshot,
  canEvaluateProduction,
  deriveBrowserSupport,
  deriveSttAvailable,
  detectMicrophoneCaptureSupport,
  detectSpeechRecognitionSupport,
  queryMicPermission,
  requestMicPermission,
  subscribeToMicPermissionChanges,
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

describe('subscribeToMicPermissionChanges', () => {
  it('notifies and removes the permission listener', async () => {
    const listeners = new Set<() => void>()
    const status = {
      state: 'denied' as PermissionState,
      addEventListener: vi.fn((_event: string, listener: () => void) => listeners.add(listener)),
      removeEventListener: vi.fn((_event: string, listener: () => void) => listeners.delete(listener)),
    }
    vi.stubGlobal('navigator', {
      permissions: { query: vi.fn().mockResolvedValue(status) },
    })
    const onChange = vi.fn()

    const unsubscribe = await subscribeToMicPermissionChanges(onChange)
    status.state = 'granted'
    listeners.forEach((listener) => listener())

    expect(onChange).toHaveBeenCalledWith('granted')
    unsubscribe()
    expect(listeners.size).toBe(0)
  })
})

describe('detectMicrophoneCaptureSupport', () => {
  it('requires getUserMedia in a secure context', () => {
    vi.stubGlobal('window', { isSecureContext: true })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    expect(detectMicrophoneCaptureSupport()).toBe(true)
  })

  it('rejects an insecure LAN context even if a browser exposes mediaDevices', () => {
    vi.stubGlobal('window', { isSecureContext: false })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn() } })
    expect(detectMicrophoneCaptureSupport()).toBe(false)
  })
})

describe('requestMicPermission', () => {
  it('requests the microphone and releases the probe stream', async () => {
    const stop = vi.fn()
    const getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] })
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })

    await expect(requestMicPermission()).resolves.toBe('granted')
    expect(getUserMedia).toHaveBeenCalledWith({ audio: true })
    expect(stop).toHaveBeenCalledTimes(1)
  })

  it('maps an explicit browser denial to denied', async () => {
    const error = new DOMException('blocked', 'NotAllowedError')
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia: vi.fn().mockRejectedValue(error) } })

    await expect(requestMicPermission()).resolves.toBe('denied')
  })
})

describe('deriveBrowserSupport', () => {
  it('is unsupported when there is no SpeechRecognition API', () => {
    expect(deriveBrowserSupport(false, 'unknown')).toBe('unsupported')
  })

  it('is partial when the API exists but mic permission is denied', () => {
    expect(deriveBrowserSupport(true, 'denied')).toBe('partial')
  })

  it('is partial when microphone capture is unavailable', () => {
    expect(deriveBrowserSupport(true, 'unknown', false)).toBe('partial')
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

  it('is false when microphone capture is unavailable', () => {
    expect(deriveSttAvailable(true, 'unknown', true, false)).toBe(false)
  })

  it('is false when offline (conservative: Web Speech API needs network)', () => {
    expect(deriveSttAvailable(true, 'granted', false)).toBe(false)
  })

  it('is true when supported, mic not denied, and online', () => {
    expect(deriveSttAvailable(true, 'granted', true)).toBe(true)
    expect(deriveSttAvailable(true, 'unknown', true)).toBe(true)
  })
})

/** Chrome UA without Edge/Brave — required for isWebSpeechReliable(). */
function chromeNavigator(partial: Record<string, unknown> = {}) {
  return {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    ...partial,
  }
}

describe('buildCapabilitySnapshot', () => {
  it('produces a snapshot matching CapabilitySnapshotSchema — supported/online path', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: true,
        permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
        mediaDevices: { getUserMedia: vi.fn() },
      }),
    )

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot).toMatchObject({
      micPermission: 'granted',
      sttAvailable: true,
      browserSupport: 'full',
    })
  })

  it('marks Brave-like browsers as partial even when SpeechRecognition exists', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal('navigator', {
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      brave: {},
      onLine: true,
      permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
      mediaDevices: { getUserMedia: vi.fn() },
    })

    const snapshot = await buildCapabilitySnapshot()

    expect(snapshot.sttAvailable).toBe(false)
    expect(snapshot.browserSupport).toBe('partial')
    expect(canEvaluateProduction(snapshot)).toBe(false)
  })

  it('produces a snapshot for permission-denied path', async () => {
    vi.stubGlobal('window', { SpeechRecognition: function () {} })
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: true,
        permissions: { query: vi.fn().mockResolvedValue({ state: 'denied' }) },
        mediaDevices: { getUserMedia: vi.fn() },
      }),
    )

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
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: true,
        mediaDevices: { getUserMedia: vi.fn() },
      }),
    )

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
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: false,
        permissions: { query: vi.fn().mockResolvedValue({ state: 'granted' }) },
        mediaDevices: { getUserMedia: vi.fn() },
      }),
    )

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot.sttAvailable).toBe(false)
    expect(canEvaluateProduction(snapshot)).toBe(false)
  })

  it('produces a snapshot for evaluator-unavailable path (API present, permission unknown, but treated as evaluator down)', async () => {
    vi.stubGlobal('window', { webkitSpeechRecognition: function () {} })
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: true,
        permissions: undefined,
        mediaDevices: { getUserMedia: vi.fn() },
      }),
    )

    const snapshot = await buildCapabilitySnapshot()

    expect(CapabilitySnapshotSchema.safeParse(snapshot).success).toBe(true)
    expect(snapshot.micPermission).toBe('unknown')
    expect(snapshot.sttAvailable).toBe(true)
    expect(snapshot.browserSupport).toBe('full')
  })

  it('marks speech recognition unavailable on an insecure mobile URL', async () => {
    vi.stubGlobal('window', {
      webkitSpeechRecognition: function () {},
      isSecureContext: false,
    })
    vi.stubGlobal(
      'navigator',
      chromeNavigator({
        onLine: true,
        permissions: undefined,
        mediaDevices: undefined,
      }),
    )

    const snapshot = await buildCapabilitySnapshot()

    expect(snapshot).toMatchObject({
      micPermission: 'unknown',
      sttAvailable: false,
      browserSupport: 'partial',
    })
    expect(canEvaluateProduction(snapshot)).toBe(false)
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
