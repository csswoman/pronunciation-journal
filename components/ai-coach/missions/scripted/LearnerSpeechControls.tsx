'use client'

// Planned structure:
// <LearnerSpeechControls>
//   <ActiveRecordingIndicator /> (pill con ScrollingWaveform)
//   <ScoringIndicator />         (analizando con spinner)
//   <SpeechErrorBanner />        (error normalizado + reintento)
//   <MicActionButton />          (hablar / detener)
//   <PracticeModeHint />         (aviso si !canScore)
// </LearnerSpeechControls>

import Button from '@/components/ui/Button'
import { AlertCircle, Mic, MicOff, RotateCcw } from '@/components/icons'
import { ScrollingWaveform } from './ScrollingWaveform'
import type { LearnerCapture } from '@/hooks/useLearnerSpeechCapture'

interface Props {
  status: LearnerCapture['status']
  /** Grabación real del micrófono, no el estado del reconocedor. */
  isCapturing: boolean
  isScoring: boolean
  errorCode: LearnerCapture['errorCode']
  getSamples: () => Uint8Array
  peak?: number
  canScore: boolean
  onStart: () => void | Promise<void>
  onStop: () => void
  onRetry: () => void
}

export function LearnerSpeechControls({
  status,
  isCapturing,
  isScoring,
  errorCode,
  getSamples,
  peak,
  canScore,
  onStart,
  onStop,
  onRetry,
}: Props) {
  // El reconocedor se declara "listening" antes de que el micro arranque, así
  // que el indicador de grabación se ata a la captura real.
  const isListening = isCapturing
  // El botón debe ofrecer "Detener" mientras cualquiera de los dos siga vivo,
  // para no dejar al usuario sin forma de cerrar el turno.
  const canStop = isCapturing || status === 'listening'
  const isProcessing = (status === 'processing' || isScoring) && !canStop
  const isError = status === 'error'

  return (
    <div className="flex flex-col items-end gap-2 w-full">
      {/* Indicador visual activo durante la grabación con osciloscopio real */}
      {isListening && (
        <div
          role="status"
          aria-live="polite"
          data-testid="recording-indicator"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-soft border border-border-subtle text-primary animate-message-in"
        >
          <span className="size-2 rounded-full bg-primary animate-pulse" aria-hidden />
          <span className="text-caption font-medium">
            {(peak ?? 0) > 0.04 ? 'Grabando tu voz…' : 'Escuchando… acércate al micro'}
          </span>
          <ScrollingWaveform
            getSamples={getSamples}
            peak={peak}
            isActive={isListening}
          />
        </div>
      )}

      {/* Estado de análisis */}
      {isProcessing && !isListening && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-sunken text-fg-muted text-caption animate-message-in"
        >
          <span
            className="size-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"
            aria-hidden
          />
          <span>Analizando pronunciación…</span>
        </div>
      )}

      {/* Estado de error: un aviso legible, no una alarma — casi siempre es
          el micro que no arrancó, y el usuario sólo tiene que reintentar. */}
      {isError && (
        <div
          role="alert"
          className="flex max-w-full items-center gap-2 rounded-lg border border-border-subtle bg-surface-sunken px-3 py-2 text-caption text-fg-muted animate-message-in"
        >
          <AlertCircle size={15} className="shrink-0 text-warning" aria-hidden />
          <span className="flex-1">
            {errorCode === 'not-allowed'
              ? 'Permiso de micrófono denegado en tu navegador.'
              : errorCode === 'no-speech'
              ? 'No se detectó voz. Intenta hablar más cerca.'
              : errorCode === 'network'
              ? 'Error de red en el reconocimiento de voz.'
              : 'Error al capturar audio.'}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRetry}
            icon={<RotateCcw size={13} aria-hidden />}
            className="px-2 py-0.5"
          >
            Reintentar
          </Button>
        </div>
      )}

      {/* Botón de acción: Hablar en reposo, Detener durante la grabación */}
      {!isProcessing && !isError && (
        <div className="flex flex-col items-end gap-1">
          <Button
            type="button"
            variant={canStop ? 'soft' : 'primary'}
            size="sm"
            className={canStop ? 'ring-2 ring-primary/30' : 'mt-0.5'}
            icon={canStop ? <MicOff size={16} aria-hidden /> : <Mic size={16} aria-hidden />}
            onClick={canStop ? onStop : () => void onStart()}
            aria-label={canStop ? 'Detener grabación de voz' : 'Hablar'}
          >
            {canStop ? 'Detener' : 'Hablar'}
          </Button>

          {!canScore && status === 'idle' && (
            <span className="text-xxs text-fg-subtle text-right max-w-xs">
              Sin conexión para evaluar: practica y compara tu voz.
            </span>
          )}
        </div>
      )}
    </div>
  )
}
