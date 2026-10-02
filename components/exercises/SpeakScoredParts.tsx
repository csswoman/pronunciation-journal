'use client'

// Planned structure:
// <WordDisplay /> — palabra + IPA + listen
// <ShadowingFallback /> — unscored continue path

import { Mic, MicOff, Volume2 } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { SCORING_UNAVAILABLE_ES } from '@/lib/speech/browser-support-message'
import { PhoneticWordHighlight } from '@/components/pronunciation/PhoneticWordHighlight'
import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { cn } from '@/lib/cn'

/**
 * Why this attempt cannot be scored.
 * - `no-mic`: the microphone is unreachable (insecure origin, blocked
 *   permission, or no device). Not a browser-brand problem.
 * - `network`: transcription could not reach the server.
 * - `unavailable`: the evaluator itself failed after a successful capture.
 */
export type UnscoredReason = 'no-mic' | 'network' | 'unavailable'

export function WordDisplay({
  word,
  ipa,
  onListen,
}: {
  word?: string
  ipa: string
  onListen: () => void
}) {
  const bare = ipa.replace(/^\/|\/$/g, '')
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-3xl bg-lilac px-4 py-8 text-ink">
      <div className="flex items-center gap-4">
        <div className="text-display-word font-extrabold tracking-tight text-ink">
          {word ? <PhoneticWordHighlight
              word={word}
              phonemeOrIpa={ipa}
              highlightClassName="rounded-lg bg-white px-1 text-ink no-underline shadow-[0_3px_0_var(--ink)]"
            /> : '—'}
        </div>
        <button
          type="button"
          onClick={onListen}
          aria-label="Escuchar"
          className="flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-ink text-white transition-transform active:scale-95 focus-ring"
        >
          <Volume2 size={22} aria-hidden />
        </button>
      </div>
      <div className="ipa text-body-lg text-ink!">/{bare}/</div>
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
        {reason === 'no-mic'
          ? SCORING_UNAVAILABLE_ES
          : reason === 'network'
            ? 'No se pudo completar la transcripción; necesita conexión a internet. Escucha el modelo y repite la palabra; este intento no recibirá puntuación.'
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
  word,
  isListening,
  isDone,
  isScoring,
  onToggle,
}: {
  word?: string
  isListening: boolean
  isDone: boolean
  isScoring: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-fg-subtle/50 px-4 py-8">
      <span
        className={cn(
          'flex size-18 items-center justify-center rounded-full',
          isListening ? 'bg-error/15' : 'bg-fg/10',
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          disabled={isDone || isScoring}
          aria-label={isListening ? 'Detener grabación' : 'Grabar mi voz'}
          className={cn(
            'flex size-14 cursor-pointer items-center justify-center rounded-full border-none text-on-primary transition-all focus-ring disabled:opacity-40',
            isListening ? 'bg-error' : 'bg-primary',
          )}
        >
          {isListening ? <MicOff size={26} /> : <Mic size={26} />}
        </button>
      </span>
      <p className="m-0 text-body-md font-bold text-fg">
        {isListening ? 'Escuchando… toca para parar' : isScoring ? 'Analizando…' : 'Toca para hablar'}
      </p>
      {word && !isListening && !isScoring && (
        <p className="m-0 text-caption text-fg-muted">Di “{word}” en voz alta</p>
      )}
    </div>
  )
}
