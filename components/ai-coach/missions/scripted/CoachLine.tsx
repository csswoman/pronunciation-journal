'use client'

// Planned structure:
// <CoachLine>
//   <SpokenLine />       — la línea con la palabra en curso resaltada
//   <ReplayButton />
//   <ContinueButton />
// </CoachLine>

import { useEffect, useRef } from 'react'
import { useLinePlayback } from '@/hooks/useLinePlayback'
import Button from '@/components/ui/Button'
import { ArrowRight, Volume2 } from '@/components/icons'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'
import { SpokenLine } from './SpokenLine'

interface Props {
  line: ScriptLine
  onContinue: () => void
  missionId?: string
}

export function CoachLine({ line, onContinue, missionId }: Props) {
  const autoplayedRef = useRef<string | null>(null)
  const playback = useLinePlayback(line, missionId)
  const { play } = playback

  useEffect(() => {
    if (autoplayedRef.current === line.id) return
    autoplayedRef.current = line.id
    play()
  }, [line.id, play])

  return (
    <div className="flex flex-col items-start gap-2 animate-message-in">
      <div className="flex items-center gap-2">
        <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
          Coach
        </span>
        {playback.isPlaying && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xxs font-medium text-primary">
            <Volume2 size={12} aria-hidden /> Hablando…
          </span>
        )}
      </div>
      <div className="m-0 max-w-[88%] rounded-lg rounded-tl-sm border border-border-subtle bg-surface-raised/95 px-4 py-3 text-body-md text-fg shadow-xs">
        <SpokenLine text={line.text} activeIndex={playback.activeIndex} />
      </div>
      <div className="flex items-center gap-2.5 pt-1.5">
        <Button
          variant="secondary"
          size="sm"
          icon={<Volume2 size={16} aria-hidden />}
          onClick={playback.play}
          disabled={playback.isPlaying}
        >
          {playback.isPlaying ? 'Reproduciendo…' : 'Repetir'}
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon={<ArrowRight size={16} aria-hidden />}
          iconPosition="right"
          onClick={onContinue}
        >
          Continuar
        </Button>
      </div>
    </div>
  )
}
