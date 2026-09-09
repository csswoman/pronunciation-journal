'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useSpokenWordHighlight } from '@/hooks/useSpokenWordHighlight'
import { useMissionLineAudio } from '@/hooks/useMissionLineAudio'
import { estimatedDuration, wordIndexAtChar } from '@/lib/speech/word-timings'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface UseLinePlaybackReturn {
  /** Reproduce la línea completa: audio HD si existe, si no el sintetizador. */
  play: () => void
  /** Corta la reproducción en curso y apaga el resaltado. */
  stop: () => void
  isPlaying: boolean
  /** Índice de la palabra que suena ahora, o null. */
  activeIndex: number | null
}

/**
 * Reproducción de una línea de guión con resaltado palabra a palabra.
 *
 * Tres sitios necesitan exactamente esta secuencia — el turno del coach, el
 * panel de shadowing del alumno y el historial del diálogo — y la cadena de
 * fallback (audio HD → TTS nativo) es lo bastante delicada como para que
 * tenerla escrita tres veces signifique arreglar los bugs tres veces.
 */
export function useLinePlayback(line: ScriptLine, missionId?: string): UseLinePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const highlight = useSpokenWordHighlight({ text: line.text })
  const { hdAudioUrl } = useMissionLineAudio(line, missionId)

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(false)
    highlight.stop()
  }, [highlight])

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsPlaying(true)

    const finish = () => {
      setIsPlaying(false)
      highlight.stop()
    }

    // El TTS nativo es el plan B tanto si no hay URL como si la que hay falla.
    const speakFallback = () => {
      highlight.start(estimatedDuration(line.text))
      speak(line.text, {
        onEnd: finish,
        onError: finish,
        onBoundary: (charIndex) => highlight.markWord(wordIndexAtChar(line.text, charIndex)),
      })
    }

    const effectiveAudioUrl = hdAudioUrl || line.modelAudio?.path

    if (effectiveAudioUrl) {
      const audio = new Audio(effectiveAudioUrl)
      audioRef.current = audio
      highlight.start(line.modelAudio?.durationMs ?? estimatedDuration(line.text))
      audio.onended = finish
      audio.onerror = speakFallback
      void audio.play().catch(speakFallback)
      return
    }

    speakFallback()
  }, [hdAudioUrl, line, highlight])

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  return { play, stop, isPlaying, activeIndex: highlight.activeIndex }
}
