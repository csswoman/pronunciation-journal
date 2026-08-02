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

import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { ArchiveConfirmAction } from './ArchiveConfirmAction'
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
    <div className="flex w-full flex-col items-center gap-[var(--layout-stack-loose)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-[var(--space-5)]">
      <div className="flex w-full max-w-md flex-col items-center gap-[var(--layout-stack)]">
        <div className="flex flex-col items-center gap-[var(--layout-stack-tight)]">
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
          <h2 className="m-0 text-balance text-display-word font-semibold tracking-tight text-fg">
            {model.word}
          </h2>
        </div>

        {(model.meaning || model.translation) && (
          <div className="flex max-w-[40ch] flex-col items-center gap-0.5 text-center text-pretty">
            {model.meaning && <p className="m-0 text-body-md leading-relaxed text-fg">{model.meaning}</p>}
            {model.translation && (
              <p className="m-0 text-body-sm text-fg-subtle">{model.translation}</p>
            )}
          </div>
        )}

        <div className="flex w-full justify-center">
          <PillButton variant="primary" size="md" onClick={onContinue}>
            Practicar
          </PillButton>
        </div>

        {(model.ipa || model.weakForm || model.sentence) && (
          <div className="flex w-full flex-col items-center gap-[var(--layout-stack-loose)] border-t border-border-subtle pt-[var(--layout-stack-loose)]">
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
          </div>
        )}

        {onArchive && (
          <div className="flex w-full flex-col items-center">
            <ArchiveConfirmAction onArchive={onArchive} />
          </div>
        )}
      </div>
    </div>
  )
}
