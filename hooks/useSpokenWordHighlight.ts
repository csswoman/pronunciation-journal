'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { estimateWordOffsets, splitSpokenWords } from '@/lib/speech/word-timings'

interface Options {
  text: string
}

interface SpokenWordHighlight {
  activeIndex: number | null
  /** Arranca el seguimiento estimado para una locucion de `durationMs`. */
  start: (durationMs: number) => void
  /** Marca una palabra concreta: gana a la estimacion. */
  markWord: (index: number) => void
  stop: () => void
}

/**
 * Sigue que palabra suena mientras se reproduce una linea.
 *
 * Dos fuentes, por orden de fiabilidad: si el motor emite `boundary`, esa
 * marca manda y se abandona la estimacion para siempre en esa locucion; si
 * no, se avanza con temporizadores repartidos por longitud de palabra.
 * Sin duracion fiable no se resalta nada.
 */
export function useSpokenWordHighlight({ text }: Options): SpokenWordHighlight {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const hasRealMarkRef = useRef(false)

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer)
    timersRef.current = []
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    hasRealMarkRef.current = false
    setActiveIndex(null)
  }, [clearTimers])

  const markWord = useCallback((index: number) => {
    // Una marca real invalida la estimacion: los temporizadores pendientes
    // pisarian el valor correcto unos milisegundos despues.
    hasRealMarkRef.current = true
    clearTimers()
    setActiveIndex(index)
  }, [clearTimers])

  const start = useCallback((durationMs: number) => {
    clearTimers()
    hasRealMarkRef.current = false

    const words = splitSpokenWords(text)
    const offsets = estimateWordOffsets(words, durationMs)
    if (offsets.length === 0) {
      setActiveIndex(null)
      return
    }

    setActiveIndex(0)
    offsets.forEach((offset, index) => {
      if (index === 0) return
      const timer = setTimeout(() => {
        if (hasRealMarkRef.current) return
        setActiveIndex(index)
      }, offset)
      timersRef.current.push(timer)
    })
  }, [clearTimers, text])

  useEffect(() => clearTimers, [clearTimers])

  return { activeIndex, start, markWord, stop }
}
