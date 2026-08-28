// Planned structure:
// <SentenceDictationControls>
//   <AudioButtons />
//   <WordCountBadge />
//   <AnswerInput />
//   <HintPanel />
//   <FeedbackBar />
//   <CheckButton />
// </SentenceDictationControls>

import type { KeyboardEvent, RefObject } from 'react'
import { Lightbulb, Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import { PillButton } from '@/components/ui/PillButton'

export type DictationAnswerState = 'idle' | 'correct' | 'wrong'

export function AudioButtons({
  isPlaying,
  isPlayingSlow,
  onPlay,
  onPlaySlow,
}: {
  isPlaying: boolean
  isPlayingSlow: boolean
  onPlay: () => void
  onPlaySlow: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 py-1.5" aria-label="Controles de audio">
      <PillButton
        type="button"
        variant={isPlaying ? 'primary' : 'outline'}
        size="md"
        icon={isPlaying ? <SoundWaveIcon /> : <Volume2 size={18} aria-hidden />}
        onClick={onPlay}
        disabled={isPlaying}
        aria-label={isPlaying ? 'Reproduciendo audio…' : 'Escuchar oración'}
        className="min-w-[130px]"
      >
        {isPlaying ? 'Escuchando…' : 'Escuchar'}
      </PillButton>

      <PillButton
        type="button"
        variant={isPlayingSlow ? 'primary' : 'outline'}
        size="md"
        icon={<span className="font-mono text-tiny font-bold tracking-tight" aria-hidden>0.5×</span>}
        onClick={onPlaySlow}
        disabled={isPlayingSlow}
        aria-label={isPlayingSlow ? 'Reproduciendo lento…' : 'Escuchar despacio'}
      >
        {isPlayingSlow ? 'Lento…' : 'Lento'}
      </PillButton>
    </div>
  )
}

export function WordCountBadge({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center py-0.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle/80 bg-surface-sunken/80 px-3 py-1 font-mono text-tiny font-medium text-fg-muted">
        <span className="size-1.5 rounded-full bg-primary/70" aria-hidden />
        {count} {count === 1 ? 'palabra' : 'palabras'}
      </span>
    </div>
  )
}

export function AnswerInput({
  inputRef,
  value,
  disabled,
  onChange,
  onKeyDown,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>
  value: string
  disabled: boolean
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  return (
    <textarea
      ref={inputRef}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onKeyDown}
      rows={3}
      aria-label="Escribe lo que escuchas"
      placeholder="Escribe lo que escuchas…"
      className={cn(
        'w-full resize-none rounded-xl border bg-surface-sunken/60 px-4 py-3.5 text-body-lg leading-relaxed text-fg transition-colors duration-150 placeholder:text-fg-subtle focus-ring',
        disabled ? 'cursor-default border-border-subtle text-fg-subtle opacity-70' : 'border-border-default',
      )}
    />
  )
}

export function CheckButton({ disabled, onSubmit }: { disabled: boolean; onSubmit: () => void }) {
  return (
    <Button type="button" variant="primary" size="lg" fullWidth onClick={onSubmit} disabled={disabled}>
      Comprobar
    </Button>
  )
}

export function HintPanel({
  words,
  targetMeaning,
}: {
  words: string[]
  targetMeaning?: string
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-warning/20 bg-warning/5 p-4 text-left shadow-2xs animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="flex items-center gap-2 text-warning">
        <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-warning/15">
          <Lightbulb size={15} aria-hidden />
        </div>
        <span className="font-mono text-tiny uppercase tracking-wider font-semibold">Pista de palabras</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {words.map((word, index) => {
          const cleanWord = word.replace(/[^\w']/g, '')
          const firstChar = cleanWord[0] ?? word[0]
          const remainingCount = Math.max(1, cleanWord.length - 1)
          return (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-surface-base px-2.5 py-1 font-mono text-body-sm text-fg-muted shadow-2xs"
            >
              <strong className="font-bold text-fg">{firstChar}</strong>
              <span className="text-fg-subtle tracking-widest opacity-60">
                {'·'.repeat(remainingCount)}
              </span>
            </span>
          )
        })}
      </div>
      {targetMeaning && (
        <p className="pt-0.5 text-caption text-fg-muted">
          <span className="font-semibold text-fg">Palabra clave:</span> {targetMeaning}
        </p>
      )}
    </div>
  )
}

export function FeedbackBar({
  state,
  userAnswer,
  correctSentence,
}: {
  state: DictationAnswerState
  userAnswer: string
  correctSentence: string
}) {
  const isCorrect = state === 'correct'
  const diff = isCorrect ? null : diffWords(userAnswer, correctSentence)

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-xl border p-4 shadow-2xs',
        isCorrect ? 'border-success-border bg-success-soft' : 'border-border-default bg-surface-sunken',
      )}
    >
      <p className={cn('text-body-sm font-semibold', isCorrect ? 'text-success' : 'text-fg')}>
        {isCorrect ? '¡Muy bien!' : 'Casi. Esta es la oración correcta:'}
      </p>
      {diff && (
        <p className="flex flex-wrap gap-x-1.5 text-body-lg leading-relaxed">
          {diff.map((token, index) => (
            <span
              key={index}
              className={cn(
                'font-medium',
                token.match ? 'text-success' : token.missing ? 'text-fg-subtle' : 'text-error',
              )}
            >
              {token.word}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}

function SoundWaveIcon() {
  return (
    <svg width="18" height="15" viewBox="0 0 24 20" fill="currentColor" aria-hidden>
      <rect x="0" y="7" width="3" height="6" rx="1.5" opacity="0.5">
        <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="5.25" y="4" width="3" height="12" rx="1.5">
        <animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.15s" />
        <animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.15s" />
      </rect>
      <rect x="10.5" y="1" width="3" height="18" rx="1.5">
        <animate attributeName="height" values="18;10;18" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
        <animate attributeName="y" values="1;5;1" dur="0.8s" repeatCount="indefinite" begin="0.05s" />
      </rect>
      <rect x="15.75" y="4" width="3" height="12" rx="1.5">
        <animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
        <animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
      </rect>
      <rect x="21" y="7" width="3" height="6" rx="1.5" opacity="0.5">
        <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" begin="0.1s" />
        <animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" begin="0.1s" />
      </rect>
    </svg>
  )
}

function diffWords(userAnswer: string, correct: string) {
  const userWords = userAnswer.trim().split(/\s+/)
  return correct.trim().split(/\s+/).map((word, index) => {
    const userWord = userWords[index] ?? ''
    return {
      word,
      match: userWord.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, ''),
      missing: !userWord,
    }
  })
}
