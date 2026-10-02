'use client'

// Planned structure:
// <WordFeedbackFooter>
//   <PillButton primary> 🎙 Repetir «palabra»
//   <PillButton quiet>   Siguiente a mejorar › | Continuar ›

import { ChevronRight, Mic } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'

interface Props {
  /** Hay otra palabra por mejorar tras la actual. */
  hasNext: boolean
  onRetry?: () => void
  /** Siguiente palabra a mejorar, o salir del turno cuando ya no queda ninguna. */
  onNext?: () => void
}

const BIG = 'min-h-11 px-6 text-body-sm font-semibold'

export function WordFeedbackFooter({ hasNext, onRetry, onNext }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
      {onRetry && (
        <PillButton icon={<Mic size={16} aria-hidden />} onClick={onRetry} className={BIG}>
          Repetir frase
        </PillButton>
      )}
      {onNext && (
        <PillButton
          variant="quiet"
          icon={<ChevronRight size={16} aria-hidden />}
          iconPosition="right"
          onClick={onNext}
          className="min-h-11 text-body-sm font-semibold"
        >
          {hasNext ? 'Siguiente a mejorar' : 'Continuar'}
        </PillButton>
      )}
    </div>
  )
}
