'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { IPA_AUDIO_MAP, SOUNDS_BASE_URL } from '@/lib/pronunciation/ipa-audio'
import { cancelSpeech, speakText } from '@/lib/speech/synthesis'

export function useIpaChartAudio() {
  const [playingSymbol, setPlayingSymbol] = useState<string | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    return () => {
      currentAudioRef.current?.pause()
      cancelSpeech()
    }
  }, [])

  const stopSound = useCallback(() => {
    currentAudioRef.current?.pause()
    currentAudioRef.current = null
    cancelSpeech()
    setPlayingSymbol(null)
    setAudioError(null)
  }, [])

  const playSound = useCallback(
    (rawSymbol: string, example?: string) => {
      const fileName = IPA_AUDIO_MAP[rawSymbol] ?? IPA_AUDIO_MAP[rawSymbol[0]]
      stopSound()
      setAudioError(null)

      if (!fileName) {
        if (!example) {
          setAudioError('No se pudo reproducir este sonido.')
          return
        }
        setPlayingSymbol(rawSymbol)
        speakText(example, {
          onEnd: () => setPlayingSymbol(null),
          onError: () => setAudioError('No se pudo reproducir este sonido.'),
        })
        return
      }

      try {
        setPlayingSymbol(rawSymbol)
        const audio = new Audio(`${SOUNDS_BASE_URL}/${fileName}`)
        currentAudioRef.current = audio
        audio.onended = () => {
          if (example) {
            speakText(example, { onEnd: () => setPlayingSymbol(null) })
          } else {
            setPlayingSymbol(null)
          }
        }
        audio.onerror = () => {
          setPlayingSymbol(null)
          setAudioError('No se pudo reproducir este sonido.')
        }
        audio.play().catch((err) => {
          if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
            console.error(`Playback failed for ${rawSymbol}:`, err)
          }
          setPlayingSymbol(null)
          setAudioError('No se pudo reproducir este sonido.')
        })
      } catch {
        setPlayingSymbol(null)
        setAudioError('No se pudo reproducir este sonido.')
      }
    },
    [stopSound],
  )

  const toggleSound = useCallback(
    (rawSymbol: string, example?: string) => {
      if (playingSymbol === rawSymbol) {
        stopSound()
        return
      }
      playSound(rawSymbol, example)
    },
    [playSound, playingSymbol, stopSound],
  )

  return {
    playingSymbol,
    audioError,
    setAudioError,
    playSound,
    toggleSound,
  }
}
