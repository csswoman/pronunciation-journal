import { flushOutbox } from './sync-manager'

let removeOnlineListener: (() => void) | undefined

/** Registers one reconnect listener and returns a cleanup safe for remounts. */
export function initSyncListeners(userId: string | null = null): () => void {
  if (typeof window === 'undefined') return () => {}
  if (removeOnlineListener) return removeOnlineListener

  const onOnline = () => { if (userId) void flushOutbox(userId) }
  window.addEventListener('online', onOnline)
  removeOnlineListener = () => {
    window.removeEventListener('online', onOnline)
    removeOnlineListener = undefined
  }
  return removeOnlineListener
}
