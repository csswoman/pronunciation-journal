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
    <span className="font-kicker rounded-full border border-border-subtle px-2 py-0.5 text-fg-subtle">
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
        <span className="font-kicker w-20 text-fg-subtle">
          {label}
        </span>
        <span className="font-ipa text-body-lg text-fg">{ipa}</span>
      </div>
      <ListenButton onPlay={onPlay} aria-label={`Escuchar ${label.toLowerCase()}`} />
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
        <p className="m-0 text-center text-body-md leading-relaxed text-fg">
          {match ? (
            <>
              {before}
              <mark className="bg-transparent font-semibold text-fg">{match}</mark>
              {after}
            </>
          ) : (
            sentence
          )}
        </p>
        <ListenButton iconOnly onPlay={onListen} aria-label="Escuchar oración" />
      </div>
      {sentenceIpa && (
        <p className="ipa m-0 max-w-[36ch] text-center text-body-lg leading-relaxed text-fg-muted">
          {sentenceIpa}
        </p>
      )}
    </div>
  )
}

export function StudyCard({ model, onContinue, onListen, onArchive }: Props) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-5">
      <div className="flex flex-col items-center gap-2">
        {model.srsBadge && (
          <span className="font-kicker text-accent">
            {model.srsBadge}
          </span>
        )}
        {(model.levelBadge || (model.chips && model.chips.length > 0)) && (
          <div className="flex items-center gap-2">
            {model.levelBadge && (
              <span className="font-kicker rounded-full bg-primary px-2 py-0.5 text-on-primary">
                {model.levelBadge}
              </span>
            )}
            {model.chips?.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        )}
        <h2 className="m-0 text-display-word font-semibold tracking-tight text-fg">
          {model.word}
        </h2>
      </div>

      {(model.meaning || model.translation) && (
        <div className="flex flex-col items-center gap-0.5 text-center">
          {model.meaning && <p className="m-0 text-body-md leading-relaxed text-fg">{model.meaning}</p>}
          {model.translation && (
            <p className="text-body-sm text-fg-subtle m-0">{model.translation}</p>
          )}
        </div>
      )}

      <div className="-mb-1 flex w-full justify-center">
        <PillButton variant="primary" size="md" onClick={onContinue}>
          Practicar
        </PillButton>
      </div>

      {(model.ipa || model.weakForm) && (
        <div className="w-full">
          {model.ipa && (
            <PronRow label="Cuidada" ipa={model.ipa} onPlay={() => onListen('word')} />
          )}
          {model.weakForm && (
            <PronRow label="Natural" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} />
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
        <p className="m-0 text-body-sm text-fg-muted">¿Pausar esta palabra 90 días?</p>
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
