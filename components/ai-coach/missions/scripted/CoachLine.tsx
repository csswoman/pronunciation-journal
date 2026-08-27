'use client'

// Planned structure:
// <CoachLine>
//   <LineText />
//   <ListenButton />
//   <ContinueButton />

import { useCallback, useState } from 'react'
import { speak } from '@/lib/phoneme-practice/tts'
import { resolveModelAudio } from '@/lib/speech/model-audio'
import Button from '@/components/ui/Button'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  line: ScriptLine
  onContinue: () => void
}

export function CoachLine({ line, onContinue }: Props) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handleListen = useCallback(() => {
    const source = resolveModelAudio(line)
    setIsPlaying(true)

    if (source.kind === 'synthesized') {
      speak(source.text, () => setIsPlaying(false))
      return
    }

    const audio = new Audio(source.path)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = () => {
      // El OGG pregrabado puede faltar; la síntesis mantiene la línea audible.
      speak(line.text, () => setIsPlaying(false))
    }
    void audio.play().catch(() => speak(line.text, () => setIsPlaying(false)))
  }, [line])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-raised p-4">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Coach
      </span>
      <p className="text-body text-fg">{line.text}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={handleListen} disabled={isPlaying}>
          {isPlaying ? 'Reproduciendo…' : 'Escuchar'}
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
