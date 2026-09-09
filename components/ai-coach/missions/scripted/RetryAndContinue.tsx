'use client'

// Planned structure:
// <RetryAndContinue>
//   <ButtonRetry />
//   <ButtonContinue />
// </RetryAndContinue>

import Button from '@/components/ui/Button'
import { ArrowRight, RotateCcw } from '@/components/icons'

interface Props {
  onRetry: () => void
  onContinue: () => void
}

/**
 * Acciones finales del turno del estudiante: repetir la locución o avanzar.
 */
export function RetryAndContinue({ onRetry, onContinue }: Props) {
  return (
    <div className="flex items-center gap-2.5 pt-1.5">
      <Button
        variant="secondary"
        size="sm"
        icon={<RotateCcw size={16} aria-hidden />}
        onClick={onRetry}
      >
        Repetir
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
  )
}
