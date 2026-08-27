'use client'

// Planned structure:
// <CoachLine>
//   <LineText />
//   <ReplayButton />
//   <ContinueButton />

import { useCallback, useEffect, useRef, useState } from 'react'
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
  const autoplayedRef = useRef<string | null>(null)

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

  // El coach habla solo al llegar su turno: la mision es escuchar y responder,
  // no pulsar un boton para que empiece. `autoplayedRef` la ata al id de la
  // linea, asi que un re-render no la repite pero avanzar de turno si.
  useEffect(() => {
    if (autoplayedRef.current === line.id) return
    autoplayedRef.current = line.id
    handleListen()
  }, [line.id, handleListen])

  return (
    <div className="flex flex-col gap-2">
      <span className="font-caption text-xs font-semibold uppercase tracking-wider text-fg-muted">
        Coach
      </span>
      <p className="m-0 text-body text-fg">{line.text}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={handleListen} disabled={isPlaying}>
          {isPlaying ? 'Reproduciendo…' : 'Repetir'}
        </Button>
        <Button variant="primary" onClick={onContinue}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
