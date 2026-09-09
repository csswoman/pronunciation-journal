'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const BUFFER_SIZE = 200
const SILENCE_VAL = 128

export interface UseVoiceLevelReturn {
  getSamples: () => Uint8Array
  peak: number
}

/**
 * Convierte un MediaStream en muestras de forma de onda y nivel de amplitud
 * en tiempo real para visualizadores de audio y osciloscopios.
 */
export function useVoiceLevel(stream: MediaStream | null): UseVoiceLevelReturn {
  const [peak, setPeak] = useState(0)
  const ringBufferRef = useRef<Uint8Array>(new Uint8Array(BUFFER_SIZE).fill(SILENCE_VAL))
  const rawBufferRef = useRef<Uint8Array<ArrayBuffer> | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const intervalIdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const getSamples = useCallback(() => {
    return ringBufferRef.current
  }, [])

  useEffect(() => {
    if (!stream) {
      setPeak(0)
      ringBufferRef.current.fill(SILENCE_VAL)
      return
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return

    const audioCtx = new AudioContextClass()
    audioContextRef.current = audioCtx

    const analyser = audioCtx.createAnalyser()
    analyser.fftSize = 2048
    analyser.smoothingTimeConstant = 0.6
    analyserRef.current = analyser

    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const rawData = new Uint8Array(analyser.frequencyBinCount)
    rawBufferRef.current = rawData

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const calculatePeak = () => {
      analyser.getByteTimeDomainData(rawData)
      let maxDev = 0
      for (let i = 0; i < rawData.length; i++) {
        const dev = Math.abs(rawData[i]! - SILENCE_VAL)
        if (dev > maxDev) maxDev = dev
      }
      return Math.min(1, maxDev / 128)
    }

    if (reduceMotion) {
      intervalIdRef.current = setInterval(() => {
        setPeak(calculatePeak())
      }, 100)
    } else {
      const step = () => {
        analyser.getByteTimeDomainData(rawData)
        let maxDev = 0
        // Downsample rawData (1024 bins) to ringBuffer (200 bins)
        const stride = rawData.length / BUFFER_SIZE
        for (let i = 0; i < BUFFER_SIZE; i++) {
          const sample = rawData[Math.floor(i * stride)]!
          ringBufferRef.current[i] = sample
          const dev = Math.abs(sample - SILENCE_VAL)
          if (dev > maxDev) maxDev = dev
        }
        setPeak(Math.min(1, maxDev / 128))
        rafIdRef.current = requestAnimationFrame(step)
      }
      rafIdRef.current = requestAnimationFrame(step)
    }

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      if (intervalIdRef.current) clearInterval(intervalIdRef.current)
      source.disconnect()
      analyser.disconnect()
      void audioCtx.close()
      analyserRef.current = null
      audioContextRef.current = null
      ringBufferRef.current.fill(SILENCE_VAL)
      setPeak(0)
    }
  }, [stream])

  return { getSamples, peak }
}
