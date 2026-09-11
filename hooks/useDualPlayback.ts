// hooks/useDualPlayback.ts
'use client'

import { useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'

export interface DualPlayback {
  isPlayingNative: boolean
  isPlayingUser: boolean
  playNative: () => void
  playUser: () => void
}

/**
 * Native (TTS) vs user-recording playback state, mutually exclusive.
 * Extracted from SelfPlaybackAudioBar so ListenPanel can reuse it.
 */
export function useDualPlayback(
  targetWord: string | undefined,
  userAudioUrl: string | null | undefined,
): DualPlayback {
  const [isPlayingNative, setIsPlayingNative] = useState(false)
  const [isPlayingUser, setIsPlayingUser] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const playNative = () => {
    if (!targetWord) return
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlayingUser(false)
    }
    setIsPlayingNative(true)
    speak(targetWord, () => setIsPlayingNative(false))
  }

  const playUser = () => {
    if (!userAudioUrl) return
    window.speechSynthesis?.cancel()
    setIsPlayingNative(false)

    if (isPlayingUser && audioRef.current) {
      audioRef.current.pause()
      setIsPlayingUser(false)
      return
    }

    if (!audioRef.current) {
      audioRef.current = new Audio(userAudioUrl)
      audioRef.current.onended = () => setIsPlayingUser(false)
      audioRef.current.onerror = () => setIsPlayingUser(false)
    } else {
      audioRef.current.src = userAudioUrl
      audioRef.current.currentTime = 0
    }

    setIsPlayingUser(true)
    audioRef.current.play().catch(() => setIsPlayingUser(false))
  }

  return { isPlayingNative, isPlayingUser, playNative, playUser }
}
