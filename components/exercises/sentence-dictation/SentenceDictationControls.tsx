import type { KeyboardEvent, RefObject } from 'react'
import { Lightbulb } from '@/components/icons'
import { cn } from '@/lib/cn'

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
    <div className="flex items-center justify-center gap-4 py-2">
      <button type="button" onClick={onPlay} disabled={isPlaying} aria-label={isPlaying ? 'Reproduciendo…' : 'Escuchar oración'} className={cn('flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200', isPlaying ? 'cursor-wait border-border-default bg-surface-raised text-fg-subtle' : 'cursor-pointer border-border-default bg-surface-raised text-fg hover:border-border-strong hover:scale-105 active:scale-95')}>
        {isPlaying ? <SoundWaveIcon /> : <SpeakerIcon />}
      </button>
      <div className="flex flex-col items-center gap-1">
        <button type="button" onClick={onPlaySlow} disabled={isPlayingSlow} aria-label={isPlayingSlow ? 'Reproduciendo lento…' : 'Escuchar despacio'} className={cn('flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-200', isPlayingSlow ? 'cursor-wait border-border-default bg-surface-raised text-fg-subtle' : 'cursor-pointer border-border-subtle bg-surface-base text-fg-muted hover:border-border-default hover:text-fg hover:scale-105 active:scale-95')}>
          <span className="text-xxs font-bold leading-none" aria-hidden>0.5×</span>
        </button>
        <span className="font-kicker font-medium text-fg-subtle">Lento</span>
      </div>
    </div>
  )
}

export function WordCountDashes({ count }: { count: number }) {
  return <div className="flex items-center justify-center gap-1.5 py-1">{Array.from({ length: count }).map((_, index) => <span key={index} className="h-px w-[16px] bg-border-strong" />)}</div>
}

export function AnswerInput({ inputRef, value, disabled, onChange, onKeyDown }: { inputRef: RefObject<HTMLTextAreaElement | null>; value: string; disabled: boolean; onChange: (value: string) => void; onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void }) {
  return <textarea ref={inputRef} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={onKeyDown} rows={3} placeholder="Type what you hear…" className={cn('w-full resize-none rounded-lg border bg-surface-raised px-4 py-3.5 text-body-sm text-fg outline-none transition-all duration-150 placeholder:text-fg-subtle', disabled ? 'cursor-default border-border-subtle text-fg-subtle' : 'border-border-default focus:border-primary')} />
}

export function CheckButton({ disabled, onSubmit }: { disabled: boolean; onSubmit: () => void }) {
  return <button type="button" onClick={onSubmit} disabled={disabled} className={cn('w-full rounded-full py-3.5 text-body-sm font-semibold transition-all duration-150', disabled ? 'cursor-not-allowed bg-surface-raised text-fg-subtle' : 'cursor-pointer bg-(--cta-bg) text-(--cta-fg) hover:opacity-90 active:scale-[0.99]')}>Check</button>
}

export function HintPanel({ hint }: { hint: string }) {
  return <div className="flex items-start gap-2.5 rounded-md bg-surface-sunken px-4 py-3"><Lightbulb size={14} className="mt-0.5 shrink-0 text-fg-subtle" aria-hidden /><p className="text-caption italic text-fg-muted">{hint}</p></div>
}

export function FeedbackBar({ state, userAnswer, correctSentence }: { state: DictationAnswerState; userAnswer: string; correctSentence: string }) {
  const isCorrect = state === 'correct'
  const diff = isCorrect ? null : diffWords(userAnswer, correctSentence)
  return <div className={cn('flex flex-col gap-2 rounded-md border px-4 py-3.5', isCorrect ? 'border-success-border bg-success-soft' : 'border-border-default bg-surface-raised')}><p className={cn('text-caption font-semibold', isCorrect ? 'text-success' : 'text-fg')}>{isCorrect ? '¡Well done!' : "Almost there — here's the correct sentence:"}</p>{diff && <p className="flex flex-wrap gap-x-1 text-body-sm leading-relaxed">{diff.map((token, index) => <span key={index} className={cn('font-medium', token.match ? 'text-success' : token.missing ? 'text-fg-subtle' : 'text-error')}>{token.word}</span>)}</p>}</div>
}

function SpeakerIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
}

function SoundWaveIcon() {
  return <svg width="22" height="18" viewBox="0 0 24 20" fill="currentColor" aria-hidden><rect x="0" y="7" width="3" height="6" rx="1.5" opacity="0.5"><animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" /><animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" /></rect><rect x="5.25" y="4" width="3" height="12" rx="1.5"><animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.15s" /><animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.15s" /></rect><rect x="10.5" y="1" width="3" height="18" rx="1.5"><animate attributeName="height" values="18;10;18" dur="0.8s" repeatCount="indefinite" begin="0.05s" /><animate attributeName="y" values="1;5;1" dur="0.8s" repeatCount="indefinite" begin="0.05s" /></rect><rect x="15.75" y="4" width="3" height="12" rx="1.5"><animate attributeName="height" values="12;6;12" dur="0.8s" repeatCount="indefinite" begin="0.2s" /><animate attributeName="y" values="4;7;4" dur="0.8s" repeatCount="indefinite" begin="0.2s" /></rect><rect x="21" y="7" width="3" height="6" rx="1.5" opacity="0.5"><animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" begin="0.1s" /><animate attributeName="y" values="7;4;7" dur="0.8s" repeatCount="indefinite" begin="0.1s" /></rect></svg>
}

function diffWords(userAnswer: string, correct: string) {
  const userWords = userAnswer.trim().split(/\s+/)
  return correct.trim().split(/\s+/).map((word, index) => {
    const userWord = userWords[index] ?? ''
    return { word, match: userWord.toLowerCase().replace(/[^\w]/g, '') === word.toLowerCase().replace(/[^\w]/g, ''), missing: !userWord }
  })
}
