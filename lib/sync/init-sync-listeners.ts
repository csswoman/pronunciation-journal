import { flushOutbox } from './sync-manager'

let removeOnlineListener: (() => void) | undefined

/** Registers one reconnect listener and returns a cleanup safe for remounts. */
export function initSyncListeners(): () => void {
  if (typeof window === 'undefined') return () => {}
  if (removeOnlineListener) return removeOnlineListener

  const onOnline = () => { void flushOutbox() }
  window.addEventListener('online', onOnline)
  removeOnlineListener = () => {
    window.removeEventListener('online', onOnline)
    removeOnlineListener = undefined
  }
  return removeOnlineListener
}
