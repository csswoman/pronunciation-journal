'use client'

import { useCallback } from 'react'
import { playUiCue } from '@/lib/ui-sounds/cues'
import { useUISoundsStore } from '@/lib/stores/uiSoundsStore'

/**
 * Exercise / quiz interaction sounds (cuelume).
 * Mapping: tap→tick, correct→sparkle, wrong→droplet.
 */
export function useUISounds() {
  const soundEnabled = useUISoundsStore((s) => s.soundEnabled)

  const playTap = useCallback(() => {
    if (!soundEnabled) return
    playUiCue('tap')
  }, [soundEnabled])

  const playCorrect = useCallback(() => {
    if (!soundEnabled) return
    playUiCue('correct')
  }, [soundEnabled])

  const playWrong = useCallback(() => {
    if (!soundEnabled) return
    playUiCue('wrong')
  }, [soundEnabled])

  return { playTap, playCorrect, playWrong }
}
