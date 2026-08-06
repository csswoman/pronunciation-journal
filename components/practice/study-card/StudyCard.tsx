'use client'

// Planned structure:
// <StudyCard>
//   <ChipRow />          — optional metadata badges (rank / pos / cefr)
//   <WordHeading />      — the word itself
//   <MeaningBlock />     — optional meaning + translation
//   <PronRow natural />  — optional weak-form IPA + listen
//   <PronRow cuidada />  — optional IPA + listen (word audio)
//   <SentenceBlock />    — optional example + listen + sentence IPA
//   <Actions />          — Continuar + optional skip link
// </StudyCard>

import { PillButton } from '@/components/ui/PillButton'
import { ListenButton } from '@/components/ui/ListenButton'
import { ArchiveConfirmAction } from './ArchiveConfirmAction'
import { cn } from '@/lib/cn'
import type { StudyCardModel } from '@/lib/practice/study-card/model'

/** What the user asked to hear — the parent maps this to a TTS string or audio_url. */
export type ListenTarget = 'word' | 'weak' | 'sentence'

interface Props {
  model: StudyCardModel
  onContinue: () => void
  onListen: (target: ListenTarget) => void
  /** Primary CTA label. Default Continuar (first-look); pass Practicar for legacy intros. */
  continueLabel?: string
  /** Immersive essential-words study mode: flat layout, no nested card chrome. */
  variant?: 'default' | 'immersive'
  /** Session context above the word (e.g. block progress). */
  contextLine?: string
  /** Deferred verification: skip in-block practice, verify near session end. */
  onOmit?: () => void
  /** Copy for the low-emphasis skip action. */
  omitLabel?: string
  /** Immediate archive ("Ya la sé"). Prefer onOmit for essential-words first-look. */
  onArchive?: () => void
}

function Chip({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'font-kicker rounded-full px-2 py-0.5',
        accent
          ? 'bg-primary text-on-primary'
          : 'border border-border-subtle text-fg-subtle',
      )}
    >
      {children}
    </span>
  )
}

function ImmersiveListenGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-3">{children}</div>
}

function ImmersiveListenRow({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex w-full items-center gap-3', className)}>
      {children}
    </div>
  )
}

function PronRow({
  label, ipa, onPlay, immersive,
}: { label: string; ipa: string; onPlay: () => void; immersive?: boolean }) {
  if (!immersive) {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle py-2 last:border-b-0">
        <div className="flex items-baseline gap-3">
          <span className="font-kicker w-20 text-fg-subtle">{label}</span>
          <span className="font-ipa text-body-lg text-fg">{ipa}</span>
        </div>
        <ListenButton onPlay={onPlay} aria-label={`Escuchar ${label.toLowerCase()}`} />
      </div>
    )
  }

  return (
    <ImmersiveListenRow>
      <ListenButton
        iconOnly
        onPlay={onPlay}
        aria-label={`Escuchar pronunciación ${label}`}
      />
      <span className="w-16 shrink-0 text-left font-caption text-fg-muted">{label}</span>
      <span className="font-ipa text-body-md text-fg">{ipa}</span>
    </ImmersiveListenRow>
  )
}

function SentenceBlock({
  sentence, word, onListen, highlightPrimary, immersive,
}: { sentence: string; word: string; onListen: () => void; highlightPrimary?: boolean; immersive?: boolean }) {
  const regex = new RegExp(`\\b(${word})\\b`, 'i')
  const [before, match, after] = sentence.split(regex)
  const content = (
    <>
      <ListenButton iconOnly onPlay={onListen} aria-label="Escuchar oración" />
      <p className="m-0 min-w-0 flex-1 text-left text-body-md leading-relaxed text-fg">
        {match ? (
          <>
            {before}
            <mark
              className={cn(
                'bg-transparent font-semibold',
                highlightPrimary ? 'text-primary' : 'text-fg',
              )}
            >
              {match}
            </mark>
            {after}
          </>
        ) : (
          sentence
        )}
      </p>
    </>
  )

  if (immersive) {
    return <ImmersiveListenRow className="items-start">{content}</ImmersiveListenRow>
  }

  return (
    <div className="flex w-full items-center gap-3 rounded-lg bg-surface-base px-3 py-3">
      {content}
    </div>
  )
}

function StudyCardBody({
  model,
  onListen,
  immersive,
}: {
  model: StudyCardModel
  onListen: (target: ListenTarget) => void
  immersive: boolean
}) {
  return (
    <div className="flex w-full flex-col items-center gap-layout-stack text-center">
      {(model.levelBadge || (model.chips && model.chips.length > 0)) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {model.levelBadge ? <Chip accent>{model.levelBadge}</Chip> : null}
          {model.chips?.map((chip) => (
            <Chip key={chip}>{chip}</Chip>
          ))}
        </div>
      )}

      <h2 className="m-0 text-balance text-display-word font-semibold tracking-tight text-fg">
        {model.word}
      </h2>

      {(model.meaning || model.translation) && (
        <div className="flex max-w-[40ch] flex-col items-center gap-1 text-pretty">
          {immersive ? (
            <>
              {model.translation ? (
                <p className="m-0 text-body-md text-fg">{model.translation}</p>
              ) : null}
              {model.meaning ? (
                <p className="m-0 text-body-sm text-fg-muted">{model.meaning}</p>
              ) : null}
            </>
          ) : (
            <>
              {model.meaning ? <p className="m-0 text-body-md leading-relaxed text-fg">{model.meaning}</p> : null}
              {model.translation ? (
                <p className="m-0 text-body-sm text-fg-subtle">{model.translation}</p>
              ) : null}
            </>
          )}
        </div>
      )}

      {(model.ipa || model.weakForm || model.sentence) && (
        <div
          className={cn(
            'flex w-full flex-col',
            immersive ? 'border-t border-border-subtle pt-layout-stack' : 'items-center gap-[var(--layout-stack-loose)] border-t border-border-subtle pt-[var(--layout-stack-loose)]',
          )}
        >
          {immersive ? (
            <ImmersiveListenGroup>
              {model.weakForm ? (
                <PronRow label="natural" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} immersive />
              ) : null}
              {model.ipa ? (
                <PronRow
                  label="cuidada"
                  ipa={model.ipa}
                  onPlay={() => onListen('word')}
                  immersive
                />
              ) : null}
              {model.sentence ? (
                <SentenceBlock
                  sentence={model.sentence}
                  word={model.word}
                  onListen={() => onListen('sentence')}
                  highlightPrimary
                  immersive
                />
              ) : null}
            </ImmersiveListenGroup>
          ) : (
            <>
              <div className="w-full">
                {model.ipa ? (
                  <PronRow
                    label="Cuidada"
                    ipa={model.ipa}
                    onPlay={() => onListen('word')}
                  />
                ) : null}
                {model.weakForm ? (
                  <PronRow label="Natural" ipa={model.weakForm.ipa} onPlay={() => onListen('weak')} />
                ) : null}
              </div>
              {model.sentence ? (
                <>
                  <SentenceBlock
                    sentence={model.sentence}
                    word={model.word}
                    onListen={() => onListen('sentence')}
                  />
                  {model.sentenceIpa ? (
                    <p className="ipa m-0 max-w-[36ch] text-center text-body-lg leading-relaxed text-fg-muted">
                      {model.sentenceIpa}
                    </p>
                  ) : null}
                </>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export function StudyCard({
  model,
  onContinue,
  onListen,
  continueLabel = 'Continuar',
  variant = 'default',
  contextLine,
  onOmit,
  omitLabel = 'Ya la sé, sáltala',
  onArchive,
}: Props) {
  const immersive = variant === 'immersive'

  const body = (
    <>
      {immersive && contextLine ? (
        <p className="m-0 text-center text-caption text-fg-muted">{contextLine}</p>
      ) : null}
      {!immersive && model.srsBadge ? (
        <span className="font-kicker text-accent">{model.srsBadge}</span>
      ) : null}
      <StudyCardBody model={model} onListen={onListen} immersive={immersive} />
    </>
  )

  return (
    <div className={cn('flex w-full flex-col items-center', immersive ? 'gap-layout-stack' : 'gap-[var(--layout-stack-loose)]')}>
      {immersive ? (
        body
      ) : (
        <div className="flex w-full max-w-md flex-col items-center gap-[var(--layout-stack)] rounded-lg border border-border-subtle bg-surface-raised layout-card-pad sm:gap-[var(--space-5)]">
          <div className="flex flex-col items-center gap-[var(--layout-stack-tight)]">
            {body}
          </div>
        </div>
      )}

      <div className={cn('flex w-full flex-col items-center', immersive ? 'gap-3' : 'max-w-sm gap-2')}>
        <PillButton
          variant="primary"
          size="md"
          className="w-full"
          onClick={onContinue}
          data-cuelume-press="press"
          data-cuelume-release="release"
        >
          {continueLabel}
        </PillButton>
        {onOmit ? (
          <button
            type="button"
            onClick={onOmit}
            className="self-start border-none bg-transparent px-1 py-1 text-caption text-fg-muted transition-colors hover:text-fg-subtle focus-ring"
          >
            {omitLabel}
          </button>
        ) : null}
        {!onOmit && onArchive ? <ArchiveConfirmAction onArchive={onArchive} /> : null}
      </div>
    </div>
  )
}
