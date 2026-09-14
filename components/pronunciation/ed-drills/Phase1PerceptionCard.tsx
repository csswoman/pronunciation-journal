'use client'

// Planned structure:
// <Phase1PerceptionCard>
//   <PerceptionPrompt />
//   <PerceptionChoices />
//   <PerceptionFeedback />
// </Phase1PerceptionCard>

import { useCallback, useState } from 'react'
import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeExerciseCard } from '@/components/practice/session/PracticeActionBar'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/phoneme-practice/tts'
import type { EdDrillItem } from '@/lib/pronunciation/ed-drills/types'

interface Phase1PerceptionCardProps {
  item: EdDrillItem
  onComplete: (correct: boolean) => void
}

export function Phase1PerceptionCard({ item, onComplete }: Phase1PerceptionCardProps) {
  const [isRevealed, setIsRevealed] = useState(false)
  const [selected, setSelected] = useState<'present' | 'past' | null>(null)
  const environment = item.environments[1]

  const revealAudio = useCallback(() => {
    speak(environment.sentence, { onEnd: () => setIsRevealed(true), onError: () => setIsRevealed(true) })
  }, [environment.sentence])

  const selectAnswer = useCallback((answer: 'present' | 'past') => {
    if (selected) return
    setIsRevealed(true)
    setSelected(answer)
    onComplete(answer === 'past')
  }, [onComplete, selected])

  return (
    <PracticeExerciseCard spacing="roomy">
      <div className="flex w-full flex-col items-center gap-2 text-center">
        <span className="font-kicker text-primary">Fase 1 · Oído ciego</span>
        <h2 className="text-h3 text-fg">¿Escuchaste presente o pasado?</h2>
        <p className="text-body-sm text-fg-muted">Escucha antes de mirar las opciones.</p>
        <ListenButton onPlay={revealAudio} label="Escuchar audio" />
      </div>

      <div
        data-testid="perception-options"
        className={cn('grid w-full gap-3 transition-[filter] sm:grid-cols-2', !isRevealed && 'blur-sm')}
      >
        <button
          type="button"
          aria-label="Escuchar opción de presente"
          onClick={() => selectAnswer('present')}
          disabled={selected !== null}
          className={cn(
            'min-h-11 rounded-md border border-border-subtle bg-surface-base px-4 py-3 text-left text-body-sm text-fg transition-colors focus-ring hover:bg-surface-sunken disabled:cursor-default',
            !isRevealed && 'select-none',
            selected === 'present' && 'border-error bg-error-soft',
          )}
        >
          {environment.contrastSentence}
        </button>
        <button
          type="button"
          aria-label="Escuchar opción de pasado"
          onClick={() => selectAnswer('past')}
          disabled={selected !== null}
          className={cn(
            'min-h-11 rounded-md border border-border-subtle bg-surface-base px-4 py-3 text-left text-body-sm text-fg transition-colors focus-ring hover:bg-surface-sunken disabled:cursor-default',
            !isRevealed && 'select-none',
            selected === 'past' && 'border-success bg-success-soft',
          )}
        >
          {environment.sentence}
        </button>
      </div>

      {selected ? (
        <p className={cn('text-body-sm font-medium', selected === 'past' ? 'text-success' : 'text-error')}>
          {selected === 'past' ? '¡Exacto! Escuchaste el pasado.' : 'Era el presente. Escucha el cierre final una vez más.'}
        </p>
      ) : null}
    </PracticeExerciseCard>
  )
}
