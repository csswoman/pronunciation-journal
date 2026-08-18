'use client'

import { Mic, MicOff, Loader2 } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { SelfGradeBar } from './SelfGradeBar'
import { micErrorMessage } from './mic-error-message'
import { cn } from '@/lib/cn'

// Planned structure:
// <SpeakMicPanel>
//   <SelfGradeBar | mic button + status + retry />
// </SpeakMicPanel>

interface SpeakMicPanelProps {
  useFallback: boolean
  isListening: boolean
  isProcessing: boolean
  isError: boolean
  errorDetail: string | null
  submitError: string | null
  onMicToggle: () => void
  onSelfGrade: (quality: number) => void
  onRetry: () => void
}

export function SpeakMicPanel({
  useFallback,
  isListening,
  isProcessing,
  isError,
  errorDetail,
  submitError,
  onMicToggle,
  onSelfGrade,
  onRetry,
}: SpeakMicPanelProps) {
  if (useFallback) {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <p className="m-0 text-caption text-fg-subtle">
          Micrófono no disponible en este navegador — practica en voz alta y califícate:
        </p>
        <SelfGradeBar onGrade={onSelfGrade} />
        {submitError && <p className="m-0 text-center text-caption text-error">{submitError}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <PillButton
        type="button"
        variant="primary"
        onClick={onMicToggle}
        disabled={isProcessing}
        aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
        className={cn('h-16 w-16 p-0', isListening && 'bg-error hover:bg-error')}
      >
        {isProcessing ? (
          <Loader2 size={24} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={24} />
        ) : (
          <Mic size={24} />
        )}
      </PillButton>
      <p className="m-0 text-caption text-fg-subtle">
        {isListening
          ? 'Escuchando… toca para parar'
          : isProcessing
            ? 'Analizando…'
            : 'Toca para hablar'}
      </p>
      {isError && (
        <p className="m-0 max-w-xs text-center text-caption text-error">
          {micErrorMessage(errorDetail)}{' '}
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer border-none bg-transparent font-[inherit] text-caption text-error underline focus-ring"
          >
            Reintentar
          </button>
        </p>
      )}
    </div>
  )
}
