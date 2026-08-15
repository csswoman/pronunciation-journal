'use client'

// Planned structure:
// <WordDisplay /> — palabra + IPA + listen
// <ShadowingFallback /> — unscored continue path

import { Mic, MicOff } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { BROWSER_BLOCKS_SCORING_ES } from '@/lib/speech/browser-support-message'
import { PhoneticWordHighlight } from '@/components/pronunciation/PhoneticWordHighlight'
import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { cn } from '@/lib/cn'

export type UnscoredReason = 'unsupported' | 'browser' | 'unavailable'

export function WordDisplay({
  word,
  ipa,
  onListen,
}: {
  word?: string
  ipa: string
  onListen: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        <div className="text-display-word font-bold text-fg tracking-tight">
          {word ? <PhoneticWordHighlight word={word} phonemeOrIpa={ipa} /> : '—'}
        </div>
        <ListenButton iconOnly onPlay={onListen} aria-label="Escuchar" />
      </div>
      <div className="ipa text-fg-muted">{ipa}</div>
    </div>
  )
}

export function ShadowingFallback({
  word,
  reason,
  onContinue,
}: {
  word?: string
  reason: UnscoredReason
  onContinue: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-caption text-fg-muted text-center max-w-xs m-0">
        {reason === 'unsupported'
          ? 'Tu navegador no admite puntuación por voz. Escucha el modelo y repite la palabra; este intento no recibirá puntuación.'
          : reason === 'browser'
            ? BROWSER_BLOCKS_SCORING_ES
            : 'La puntuación por voz no está disponible ahora. Escucha el modelo y repite la palabra; este intento no recibirá puntuación.'}
      </p>
      <ListenButton onPlay={() => word && speak(word)} label="Escuchar" />
      <PracticeActionBar>
        <PracticeContinueButton onClick={onContinue}>Continuar sin puntuación</PracticeContinueButton>
      </PracticeActionBar>
    </div>
  )
}

export function SpeakMicButton({
  isListening,
  isDone,
  isScoring,
  onToggle,
}: {
  isListening: boolean
  isDone: boolean
  isScoring: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={onToggle}
        disabled={isDone || isScoring}
        aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
        className={cn(
          'w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all text-on-primary focus-ring disabled:opacity-40',
          isListening
            ? 'bg-error shadow-[0_0_0_14px_color-mix(in_oklch,var(--error)_18%,transparent)]'
            : 'bg-primary shadow-[0_4px_16px_color-mix(in_oklch,var(--primary)_35%,transparent)]',
        )}
      >
        {isListening ? <MicOff size={28} /> : <Mic size={28} />}
      </button>
      <p className="text-caption text-fg-subtle tracking-wider m-0">
        {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
      </p>
    </div>
  )
}
