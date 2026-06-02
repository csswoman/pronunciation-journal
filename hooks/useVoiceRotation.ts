'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { getEnglishVoices, invalidateVoiceCache } from '@/lib/phoneme-practice/tts'

/**
 * Maintains a rotating index into the available English TTS voices for a session.
 * Call `nextVoice()` after each exercise playback to advance the rotation.
 * Returns `currentVoice` (undefined if voices unavailable) and `nextVoice`.
 */
export function useVoiceRotation() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const indexRef = useRef(0)
  const [currentVoice, setCurrentVoice] = useState<SpeechSynthesisVoice | undefined>(undefined)

  useEffect(() => {
    if (typeof window === 'undefined') return

    function loadVoices() {
      invalidateVoiceCache()
      const v = getEnglishVoices()
      if (v.length > 0) {
        setVoices(v)
        setCurrentVoice(v[0])
      }
    }

    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const nextVoice = useCallback(() => {
    if (voices.length < 2) return
    indexRef.current = (indexRef.current + 1) % voices.length
    setCurrentVoice(voices[indexRef.current])
  }, [voices])

  return { currentVoice, nextVoice }
}
