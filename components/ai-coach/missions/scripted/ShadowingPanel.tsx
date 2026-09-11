'use client'

// Planned structure:
// <ShadowingPanel>
//   <PlayPhraseButton /> (escuchar la frase completa)
//   <TappableLine />     (la frase, con cada palabra tocable para oírla aislada)
// </ShadowingPanel>

import { useCallback, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { useLinePlayback } from '@/hooks/useLinePlayback'
import { splitSpokenWords } from '@/lib/speech/word-timings'
import { Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  line: ScriptLine
  missionId?: string
}

/**
 * El modelo a imitar antes de hablar.
 *
 * La frase se escribe una sola vez: cada palabra es a la vez texto legible y
 * botón para oírla aislada. Repetir la frase arriba como título y otra vez
 * abajo troceada en chips la hacía leer dos veces sin añadir nada.
 */
export function ShadowingPanel({ line, missionId }: Props) {
  const [tappedWordIndex, setTappedWordIndex] = useState<number | null>(null)
  const playback = useLinePlayback(line, missionId)
  const words = splitSpokenWords(line.text)

  const handlePlayFullPhrase = useCallback(() => {
    playback.stop()
    setTappedWordIndex(null)
    playback.play()
  }, [playback])

  const handlePlayWord = useCallback(
    (word: string, index: number) => {
      playback.stop()
      setTappedWordIndex(index)
      const clear = () => setTappedWordIndex((curr) => (curr === index ? null : curr))
      speak(word, { onEnd: clear, onError: clear })
    },
    [playback],
  )

  return (
    <div className="flex w-full flex-col gap-2 rounded-xl border border-border-subtle bg-surface-raised/95 p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
          Tu frase
        </span>
        <button
          type="button"
          onClick={handlePlayFullPhrase}
          disabled={playback.isPlaying}
          aria-label={playback.isPlaying ? 'Reproduciendo frase' : 'Escuchar frase'}
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1',
            'text-caption font-medium transition-colors cursor-pointer',
            'text-fg-muted hover:bg-surface-sunken hover:text-fg',
            'disabled:cursor-default disabled:bg-primary-soft disabled:text-primary',
          )}
        >
          <Volume2 size={14} aria-hidden />
          {playback.isPlaying ? 'Sonando…' : 'Escuchar'}
        </button>
      </div>

      {/* La frase, palabra a palabra: se lee seguida, pero cada palabra suena al tocarla. */}
      <div className="flex flex-wrap items-baseline gap-x-0.5 gap-y-1 text-body-md leading-relaxed text-fg">
        {words.map((word, index) => {
          const isActive = playback.activeIndex === index || tappedWordIndex === index
          return (
            <button
              key={`${word}-${index}`}
              type="button"
              onClick={() => handlePlayWord(word, index)}
              aria-label={`Escuchar ${word}`}
              className={cn(
                'rounded-md px-1 py-0.5 transition-colors cursor-pointer',
                'hover:bg-surface-sunken',
                isActive && 'bg-primary-soft font-semibold text-primary',
              )}
            >
              {word}
            </button>
          )
        })}
      </div>
    </div>
  )
}
