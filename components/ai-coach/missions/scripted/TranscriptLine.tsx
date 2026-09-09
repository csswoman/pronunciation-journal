'use client'

// Planned structure:
// <TranscriptLine>
//   <SpeakerLabel />
//   <Bubble />       — el texto, con la palabra que suena resaltada
//   <ReplayButton /> — vuelve a oír una línea ya recorrida
// </TranscriptLine>

import { useLinePlayback } from '@/hooks/useLinePlayback'
import { Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import { SpokenLine } from './SpokenLine'
import type { ScriptLine } from '@/lib/ai-practice/missions/types'

interface Props {
  line: ScriptLine
  missionId?: string
}

/**
 * Una línea ya recorrida del diálogo, que se puede volver a escuchar.
 *
 * Antes el historial era inerte: en cuanto pasabas tu turno, la frase del
 * coach que estabas contestando dejaba de poder reproducirse, justo cuando
 * más falta hace para comparar. El botón sólo aparece en las líneas del
 * coach — las tuyas se recomparan con tu propia grabación, no con el modelo.
 */
export function TranscriptLine({ line, missionId }: Props) {
  const isCoach = line.speaker === 'coach'
  const playback = useLinePlayback(line, missionId)

  return (
    <li className={cn('flex flex-col gap-1.5', isCoach ? 'items-start' : 'items-end')}>
      <span className="text-xxs font-semibold uppercase tracking-wider text-fg-subtle">
        {isCoach ? 'Coach' : 'Tú'}
      </span>
      <div
        className={cn(
          'group flex max-w-[88%] items-start gap-2 rounded-lg px-3.5 py-2.5 text-body-sm shadow-xs',
          isCoach
            ? 'rounded-tl-sm border border-border-subtle/80 bg-surface-raised/90 text-fg-muted'
            : 'rounded-tr-sm border border-border-subtle bg-primary-soft/70 text-fg',
        )}
      >
        {isCoach ? (
          <>
            <span className="min-w-0">
              <SpokenLine text={line.text} activeIndex={playback.activeIndex} />
            </span>
            <button
              type="button"
              onClick={playback.play}
              disabled={playback.isPlaying}
              aria-label={`Volver a escuchar: ${line.text}`}
              className={cn(
                'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full',
                'text-fg-subtle transition-colors cursor-pointer',
                'hover:bg-surface-sunken hover:text-fg',
                'disabled:cursor-default disabled:bg-primary-soft disabled:text-primary',
              )}
            >
              <Volume2 size={13} aria-hidden />
            </button>
          </>
        ) : (
          line.text
        )}
      </div>
    </li>
  )
}
