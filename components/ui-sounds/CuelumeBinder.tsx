'use client'

// Planned structure:
// <CuelumeBinder /> — mounts once; bind() + sync sound prefs

import { useEffect } from 'react'
import { initCuelume, syncCuelumeEnabled } from '@/lib/ui-sounds/cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

/** Wires cuelume and early audio unlock once for the authenticated shell. */
export function CuelumeBinder() {
  const soundPreference = useUISoundsStore((s) => s.soundPreference)

  useEffect(() => {
    initCuelume()
  }, [])

  useEffect(() => {
    syncCuelumeEnabled()
  }, [soundPreference])

  return null
}
