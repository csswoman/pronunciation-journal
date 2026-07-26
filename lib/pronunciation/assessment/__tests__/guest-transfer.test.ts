// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/lib/db'
import { buildValidDiagnosticResult } from './fixtures'
import {
  claimGuestPronunciationDiagnostic,
  readGuestPronunciationDiagnostic,
  saveGuestPronunciationDiagnostic,
  GUEST_DIAGNOSTIC_KEY,
} from '../guest-transfer'

function stubLocalStorage() {
  const store = new Map<string, string>()
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      clear: () => store.clear(),
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
      removeItem: (key: string) => store.delete(key),
    },
  })
}

describe('claimGuestPronunciationDiagnostic', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    stubLocalStorage()
    db.close()
    await db.delete()
    await db.open()
  })

  it('returns false immediately when nothing is stored', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(claimGuestPronunciationDiagnostic('user-1')).resolves.toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps invalid guest data local and never sends it', async () => {
    window.localStorage.setItem(GUEST_DIAGNOSTIC_KEY, JSON.stringify({ not: 'valid' }))
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(claimGuestPronunciationDiagnostic('user-1')).resolves.toBe(false)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(window.localStorage.getItem(GUEST_DIAGNOSTIC_KEY)).not.toBeNull()
  })

  it('validates, POSTs, mirrors Dexie, and clears the guest snapshot only after success', async () => {
    const guestResult = buildValidDiagnosticResult('guest-placeholder')
    saveGuestPronunciationDiagnostic(guestResult)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await expect(claimGuestPronunciationDiagnostic('user-1')).resolves.toBe(true)

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/pronunciation-assessment',
      expect.objectContaining({ method: 'POST' })
    )
    const sentBody = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body)
    expect(sentBody.result.userId).toBe('user-1')
    expect(typeof sentBody.id).toBe('string')
    expect(window.localStorage.getItem(GUEST_DIAGNOSTIC_KEY)).toBeNull()

    const mirrored = await db.pronunciationAssessments.get(sentBody.id)
    expect(mirrored?.userId).toBe('user-1')
    expect(mirrored?.syncedAt).toBeTruthy()
  })

  it('never deletes the guest snapshot on a non-ok response', async () => {
    const guestResult = buildValidDiagnosticResult('guest-placeholder')
    saveGuestPronunciationDiagnostic(guestResult)
    const fetchMock = vi.fn().mockResolvedValue({ ok: false })
    vi.stubGlobal('fetch', fetchMock)

    await expect(claimGuestPronunciationDiagnostic('user-1')).resolves.toBe(false)
    expect(window.localStorage.getItem(GUEST_DIAGNOSTIC_KEY)).not.toBeNull()
  })

  it('never deletes the guest snapshot when the request throws (network failure)', async () => {
    const guestResult = buildValidDiagnosticResult('guest-placeholder')
    saveGuestPronunciationDiagnostic(guestResult)
    const fetchMock = vi.fn().mockRejectedValue(new Error('offline'))
    vi.stubGlobal('fetch', fetchMock)

    await expect(claimGuestPronunciationDiagnostic('user-1')).resolves.toBe(false)
    expect(window.localStorage.getItem(GUEST_DIAGNOSTIC_KEY)).not.toBeNull()
  })

  it('de-dupes concurrent claims for the same userId into one in-flight promise', async () => {
    const guestResult = buildValidDiagnosticResult('guest-placeholder')
    saveGuestPronunciationDiagnostic(guestResult)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    const [a, b] = await Promise.all([
      claimGuestPronunciationDiagnostic('user-1'),
      claimGuestPronunciationDiagnostic('user-1'),
    ])

    expect(a).toBe(true)
    expect(b).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('readGuestPronunciationDiagnostic', () => {
  beforeEach(() => {
    stubLocalStorage()
  })

  it('returns a validated guest result', () => {
    const guestResult = buildValidDiagnosticResult('guest-placeholder')
    saveGuestPronunciationDiagnostic(guestResult)
    expect(readGuestPronunciationDiagnostic()?.prescription.sessions[0]?.targetId).toBeTruthy()
  })

  it('returns null when empty', () => {
    expect(readGuestPronunciationDiagnostic()).toBeNull()
  })
})
