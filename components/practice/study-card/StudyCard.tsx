'use client'

// Planned structure:
// <StudyCard>
//   <ChipRow />          — optional metadata badges (rank / pos / cefr)
//   <WordHeading />      — the word itself
//   <MeaningBlock />     — optional meaning + translation
//   <PronRow strong />   — optional IPA + listen (word audio)
//   <PronRow weak />     — optional weak-form IPA + listen (weak phrase)
//   <SentenceBlock />    — optional example + listen (sentence) + sentence IPA
//   <Actions />          — Practicar (continue) + optional "Ya la sé" (archive)
// </StudyCard>

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
        <span className="text-tiny font-semibold uppercase tracking-[0.12em] text-fg-subtle w-14">
          {label}
        </span>
        <span className="[font-family:var(--font-ipa),monospace] text-lg text-primary">{ipa}</span>
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
    <div className="flex flex-col items-center gap-1">
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
        <p className="[font-family:var(--font-ipa),monospace] text-sm text-fg-subtle m-0 text-center">
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
        {model.chips && model.chips.length > 0 && (
          <div className="flex items-center gap-2">
            {model.chips.map((chip) => (
              <Chip key={chip}>{chip}</Chip>
            ))}
          </div>
        )}
        <h2 className="[font-family:var(--font-phoneme),serif] text-5xl font-bold tracking-[-1px] leading-none text-fg m-0">
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
            <PronRow label="Strong" ipa={model.ipa} onPlay={() => onListen('word')} />
          )}
          {model.weakForm && (
            <PronRow label="Weak" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} />
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

      <div className={cn('flex flex-col items-center gap-2')}>
        <PillButton variant="primary" size="md" onClick={onContinue}>
          Practicar
        </PillButton>
        {onArchive && (
          <PillButton variant="quiet" size="sm" onClick={onArchive}>
            Ya la sé
          </PillButton>
        )}
      </div>
    </div>
  )
}
