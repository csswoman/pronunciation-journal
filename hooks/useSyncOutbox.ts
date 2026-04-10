/**
 * useSyncOutbox
 *
 * - Starts the global online/offline sync listener once per app lifetime.
 * - Exposes live counts of pending / failed outbox entries.
 * - Provides a manual `flush()` trigger for UI-driven retry buttons.
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  startSyncListener,
  flushOutbox,
  getOutboxCounts,
} from '@/lib/sync/sync-manager'

export interface OutboxStatus {
  pending: number
  syncing: number
  failed: number
}

const POLL_INTERVAL_MS = 15_000 // refresh counts every 15 s

export function useSyncOutbox() {
  const [status, setStatus] = useState<OutboxStatus>({ pending: 0, syncing: 0, failed: 0 })
  const [isFlushing, setIsFlushing] = useState(false)
  const listenerStarted = useRef(false)

  const refreshCounts = useCallback(async () => {
    const counts = await getOutboxCounts()
    setStatus({
      pending: counts.pending,
      syncing: counts.syncing,
      failed: counts.failed,
    })
  }, [])

  const flush = useCallback(async () => {
    if (isFlushing) return
    setIsFlushing(true)
    try {
      await flushOutbox()
    } finally {
      setIsFlushing(false)
      await refreshCounts()
    }
  }, [isFlushing, refreshCounts])

  useEffect(() => {
    // Register global listener only once across all hook instances
    if (!listenerStarted.current) {
      startSyncListener()
      listenerStarted.current = true
    }

    // Initial count
    refreshCounts()

    // Poll while the component is mounted so counts stay fresh
    const timer = setInterval(refreshCounts, POLL_INTERVAL_MS)

    // Refresh counts whenever we come back online
    window.addEventListener('online', refreshCounts)

    return () => {
      clearInterval(timer)
      window.removeEventListener('online', refreshCounts)
    }
  }, [refreshCounts])

  const hasPending = status.pending > 0 || status.syncing > 0
  const hasFailed = status.failed > 0

  return { status, isFlushing, flush, hasPending, hasFailed }
}
