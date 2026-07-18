'use client'

// Planned structure:
// <StudyCard>
//   <ChipRow />          — optional metadata badges (rank / pos / cefr)
//   <WordHeading />      — the word itself
//   <MeaningBlock />     — optional meaning + translation
//   <PronRow fuerte />   — optional IPA + listen (word audio)
//   <PronRow débil />    — optional weak-form IPA + listen (weak phrase)
//   <SentenceBlock />    — optional example + listen (sentence) + sentence IPA
//   <Actions />          — Practicar (continue) + optional "Ya la sé" (archive)
// </StudyCard>

import { useState } from 'react'
import { cn } from '@/lib/cn'
import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import type { StudyCardModel } from '@/lib/practice/study-card/model'

/** What the user asked to hear — the parent maps this to a TTS string or audio_url. */
export type ListenTarget = 'word' | 'weak' | 'sentence'

interface Props {
  model: StudyCardModel
  onContinue: () => void
  onListen: (target: ListenTarget) => void
  /** Optional: when present, shows a low-emphasis "Ya la sé" action. */
  onArchive?: () => void
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-fg-subtle border border-border-subtle rounded-full py-0.5 px-2">
      {children}
    </span>
  )
}

function PronRow({
  label, ipa, onPlay,
}: { label: string; ipa: string; onPlay: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-border-subtle last:border-b-0">
      <div className="flex items-baseline gap-3">
        <span className="w-16 text-tiny font-semibold uppercase tracking-[0.12em] text-fg-subtle">
          {label}
        </span>
        <span className="font-ipa text-lg text-primary">{ipa}</span>
      </div>
      <ListenButton onPlay={onPlay} aria-label={`Escuchar forma ${label.toLowerCase()}`} />
    </div>
  )
}

function SentenceBlock({
  sentence, sentenceIpa, word, onListen,
}: { sentence: string; sentenceIpa?: string; word: string; onListen: () => void }) {
  const regex = new RegExp(`\\b(${word})\\b`, 'i')
  const [before, match, after] = sentence.split(regex)
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center justify-center gap-2">
        <p className="text-base text-fg m-0 text-center">
          {match ? (
            <>
              {before}
              <mark className="bg-transparent font-semibold text-primary">{match}</mark>
              {after}
            </>
          ) : (
            sentence
          )}
        </p>
        <ListenButton iconOnly onPlay={onListen} aria-label="Escuchar oración" />
      </div>
      {sentenceIpa && (
        <p className="ipa m-0 max-w-[36ch] text-center text-fg-muted">
          {sentenceIpa}
        </p>
      )}
    </div>
  )
}

export function StudyCard({ model, onContinue, onListen, onArchive }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl bg-surface-raised px-6 py-7 shadow-sm">
      <div className="flex flex-col items-center gap-2">
        {model.srsBadge && (
          <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-accent">
            {model.srsBadge}
          </span>
        )}
        {(model.levelBadge || (model.chips && model.chips.length > 0)) && (
          <div className="flex items-center gap-2">
            {model.levelBadge && (
              <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-on-primary bg-primary rounded-full py-0.5 px-2">
                {model.levelBadge}
              </span>
            )}
            {model.chips?.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        )}
        <h2 className="font-mono text-5xl font-bold tracking-[-1px] leading-none text-fg m-0">
          {model.word}
        </h2>
      </div>

      {(model.meaning || model.translation) && (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {model.meaning && <p className="text-base text-fg m-0">{model.meaning}</p>}
          {model.translation && (
            <p className="text-sm text-fg-subtle m-0">{model.translation}</p>
          )}
        </div>
      )}

      {(model.ipa || model.weakForm) && (
        <div className="w-full">
          {model.ipa && (
            <PronRow label="Fuerte" ipa={model.ipa} onPlay={() => onListen('word')} />
          )}
          {model.weakForm && (
            <PronRow label="Débil" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} />
          )}
        </div>
      )}

      {model.sentence && (
        <SentenceBlock
          sentence={model.sentence}
          sentenceIpa={model.sentenceIpa}
          word={model.word}
          onListen={() => onListen('sentence')}
        />
      )}

      <div className={cn('mt-1 flex w-full flex-col items-center gap-4')}>
        <PillButton variant="primary" size="md" onClick={onContinue}>
          Practicar
        </PillButton>
        {onArchive && <StudyArchiveAction onArchive={onArchive} />}
      </div>
    </div>
  )
}

function StudyArchiveAction({ onArchive }: { onArchive: () => void }) {
  const [confirming, setConfirming] = useState(false)

  if (confirming) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="m-0 text-sm text-fg-muted">¿Pausar esta palabra 90 días?</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <PillButton variant="quiet" size="sm" onClick={onArchive}>
            Sí, pausar
          </PillButton>
          <PillButton variant="quiet" size="sm" onClick={() => setConfirming(false)}>
            Cancelar
          </PillButton>
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="border-none bg-transparent p-0 text-caption text-fg-subtle underline-offset-2 transition-colors hover:text-fg-muted hover:underline focus-ring"
    >
      Ya la sé
    </button>
  )
}
