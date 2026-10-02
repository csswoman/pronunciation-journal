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
import { Lightbulb, Play, Volume2 } from '@/components/icons'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import { PillButton } from '@/components/ui/PillButton'

export type DictationAnswerState = 'idle' | 'correct' | 'wrong'

const audioPillClass =
  'border-2 border-ink bg-transparent font-semibold text-ink hover:bg-ink/10 disabled:opacity-60'

export function AudioButtons({
  isPlaying,
  isPlayingSlow,
  wordCount,
  onPlay,
  onPlaySlow,
}: {
  isPlaying: boolean
  isPlayingSlow: boolean
  wordCount: number
  onPlay: () => void
  onPlaySlow: () => void
}) {
  return (
    <div
      className="flex flex-col items-center gap-4 rounded-3xl bg-butter px-4 py-8 text-ink"
      role="group"
      aria-label="Controles de audio"
    >
      <button
        type="button"
        onClick={onPlay}
        disabled={isPlaying}
        aria-label={isPlaying ? 'Reproduciendo audio…' : 'Escuchar oración'}
        className="flex size-18 cursor-pointer items-center justify-center rounded-full bg-ink text-butter transition-transform duration-150 hover:scale-105 focus-ring disabled:cursor-default disabled:hover:scale-100"
      >
        {isPlaying ? <SoundWaveIcon /> : <Play size={32} className="translate-x-0.5 fill-current" aria-hidden />}
      </button>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <PillButton
          type="button"
          variant="outline"
          size="md"
          icon={<Volume2 size={18} aria-hidden />}
          onClick={onPlay}
          disabled={isPlaying}
          aria-label="Escuchar otra vez"
          className={audioPillClass}
        >
          Escuchar otra vez
        </PillButton>
        <PillButton
          type="button"
          variant="outline"
          size="md"
          icon={<span className="font-bold tracking-tight" aria-hidden>0.5×</span>}
          onClick={onPlaySlow}
          disabled={isPlayingSlow}
          aria-label={isPlayingSlow ? 'Reproduciendo lento…' : 'Escuchar despacio'}
          className={audioPillClass}
        >
          Lento
        </PillButton>
      </div>

      <WordCountBadge count={wordCount} />
    </div>
  )
}

export function WordCountBadge({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center rounded-full bg-butter-deep/70 px-3 py-1 text-caption font-semibold text-ink">
      {count} {count === 1 ? 'palabra' : 'palabras'}
    </span>
  )
}

export function AnswerInput({
  inputRef,
  value,
  disabled,
  totalWords,
  onChange,
  onKeyDown,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>
  value: string
  disabled: boolean
  totalWords: number
  onChange: (value: string) => void
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void
}) {
  const typedWords = value.trim() ? value.trim().split(/\s+/).length : 0
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="dictation-answer" className="text-body-sm font-bold text-text-strong">
        Lo que escuchas
      </label>
      <textarea
        id="dictation-answer"
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={3}
        placeholder="Escribe lo que escuchas…"
        className={cn(
          'w-full resize-none rounded-2xl border-2 bg-surface-sunken px-5 py-4 text-body-lg leading-relaxed text-fg transition-colors duration-150 placeholder:text-fg-muted focus-ring',
          disabled ? 'cursor-default border-border-subtle text-fg-subtle opacity-70' : 'border-primary',
        )}
      />
      <p className="text-right text-caption text-fg-muted" aria-live="polite">
        {typedWords} de {totalWords} {totalWords === 1 ? 'palabra' : 'palabras'}
      </p>
    </div>
  )
}

export function CheckButton({ disabled, onSubmit }: { disabled: boolean; onSubmit: () => void }) {
  return (
    <Button type="button" variant="primary" size="lg" fullWidth onClick={onSubmit} disabled={disabled} className="rounded-full font-bold">
      <span>Comprobar</span>
      <span className="hidden rounded-md bg-white/25 px-2 py-0.5 text-tiny font-bold text-on-accent sm:inline-flex" aria-hidden>
        Enter
      </span>
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
