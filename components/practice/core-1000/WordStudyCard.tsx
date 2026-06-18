'use client'

// Planned structure:
// <WordStudyCard>
//   <WordHeading />      — palabra + chips pos/CEFR
//   <PronRow strong />   — IPA strong + TTS de la palabra aislada
//   <PronRow weak />     — IPA weak + TTS de fragmento en contexto átono
//   <SentenceBlock />    — oración + botón escuchar al lado + sentence_ipa
//   <ContinueButton />
// </WordStudyCard>

import { Volume2 } from 'lucide-react'
import { speak } from '@/lib/phoneme-practice/tts'
import { hasReduction, type CoreWord } from '@/lib/core-1000/types'
import { cn } from '@/lib/cn'

interface Props {
  entry: CoreWord
  onContinue: () => void
  onArchive: () => void
}

const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

/** Fragmento mínimo (palabra + siguiente) donde la weak form suena natural en TTS. */
function weakFormPhrase(sentence: string, word: string): string {
  const tokens = sentence.match(/\b[\w']+\b/g) ?? []
  const idx = tokens.findIndex((t) => t.toLowerCase() === word.toLowerCase())
  if (idx === -1) return word
  return tokens.slice(idx, idx + 2).join(' ')
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] border border-[var(--border-subtle)] rounded-[var(--radius-full)] py-0.5 px-2">
      {children}
    </span>
  )
}

function PronRow({
  label, ipa, onPlay, disabled,
}: { label: string; ipa: string; onPlay: () => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[var(--border-subtle)] last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-[var(--text-tertiary)] w-14">
          {label}
        </span>
        <span className="[font-family:var(--font-ipa),monospace] text-lg text-[var(--primary)]">{ipa}</span>
      </div>
      <button
        type="button"
        onClick={onPlay}
        disabled={disabled}
        aria-label={`Escuchar forma ${label.toLowerCase()}`}
        className={cn(
          'inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer [font-family:inherit] disabled:opacity-40 disabled:cursor-not-allowed',
        )}
      >
        <Volume2 size={14} aria-hidden />
        Escuchar
      </button>
    </div>
  )
}

function SentenceBlock({ entry }: { entry: CoreWord }) {
  const regex = new RegExp(`\\b(${entry.word})\\b`, 'i')
  const [before, match, after] = entry.example_sentence.split(regex)
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center gap-2">
        <p className="text-base text-[var(--text-primary)] m-0 text-center">
          {before}
          <mark className="bg-transparent font-semibold text-[var(--primary)]">{match}</mark>
          {after}
        </p>
        <button
          type="button"
          onClick={() => speak(entry.example_sentence, { rate: 0.95 })}
          disabled={!ttsAvailable}
          aria-label="Escuchar oración"
          className={cn(
            'inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-[var(--radius-full)] border border-[var(--border-subtle)] bg-transparent text-[var(--text-secondary)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          <Volume2 size={14} aria-hidden />
        </button>
      </div>
      {entry.sentence_ipa && (
        <p className="[font-family:var(--font-ipa),monospace] text-sm text-[var(--text-tertiary)] m-0 text-center">
          {entry.sentence_ipa}
        </p>
      )}
    </div>
  )
}

export function WordStudyCard({ entry, onContinue, onArchive }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <Chip>#{entry.rank}</Chip>
          <Chip>{entry.pos}</Chip>
          <Chip>{entry.cefr_level}</Chip>
        </div>
        <h2 className="[font-family:var(--font-phoneme),serif] text-5xl font-bold tracking-[-1px] leading-none text-[var(--text-primary)] m-0">
          {entry.word}
        </h2>
      </div>

      <div className="w-full">
        <PronRow
          label="Strong"
          ipa={entry.ipa_strong}
          onPlay={() => speak(entry.word)}
          disabled={!ttsAvailable}
        />
        {hasReduction(entry) && (
          <PronRow
            label="Weak"
            ipa={entry.ipa_weak!}
            onPlay={() => speak(weakFormPhrase(entry.example_sentence, entry.word), { rate: 0.95 })}
            disabled={!ttsAvailable}
          />
        )}
      </div>

      <SentenceBlock entry={entry} />

      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={onContinue}
          className="text-xs py-2 px-5 rounded-[var(--radius-full)] bg-[var(--primary)] text-white border-none cursor-pointer [font-family:inherit] font-medium"
        >
          Practicar
        </button>
        <button
          type="button"
          onClick={onArchive}
          className="text-xs py-1 px-3 rounded-[var(--radius-full)] bg-transparent border-none cursor-pointer [font-family:inherit] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Ya la sé
        </button>
      </div>
    </div>
  )
}
