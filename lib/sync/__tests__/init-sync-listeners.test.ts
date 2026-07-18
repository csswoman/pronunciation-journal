// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'

const { flushOutbox } = vi.hoisted(() => ({ flushOutbox: vi.fn() }))
vi.mock('../sync-manager', () => ({ flushOutbox }))

import { initSyncListeners } from '../init-sync-listeners'

afterEach(() => {
  flushOutbox.mockReset()
})

describe('initSyncListeners', () => {
  it('flushes once on reconnect, avoids duplicate handlers, and can be re-initialized after cleanup', () => {
    const firstCleanup = initSyncListeners()
    const secondCleanup = initSyncListeners()
    window.dispatchEvent(new Event('online'))
    expect(flushOutbox).toHaveBeenCalledOnce()

    secondCleanup()
    window.dispatchEvent(new Event('online'))
    expect(flushOutbox).toHaveBeenCalledOnce()

    const thirdCleanup = initSyncListeners()
    window.dispatchEvent(new Event('online'))
    expect(flushOutbox).toHaveBeenCalledTimes(2)
    firstCleanup()
    thirdCleanup()
  })
})
