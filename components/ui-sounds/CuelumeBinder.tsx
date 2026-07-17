'use client'

// Planned structure:
// <CuelumeBinder /> — mounts once; bind() + sync enabled prefs

import { useEffect } from 'react'
import { initCuelume, syncCuelumeEnabled } from '@/lib/ui-sounds/cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

/** Wires cuelume once for the authenticated shell. */
export function CuelumeBinder() {
  const soundEnabled = useUISoundsStore((s) => s.soundEnabled)

  useEffect(() => {
    initCuelume()
  }, [])

  useEffect(() => {
    syncCuelumeEnabled()
  }, [soundEnabled])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => syncCuelumeEnabled()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return null
}
