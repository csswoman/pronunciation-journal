'use client'

// Planned structure:
// <StudyCard>
//   <ChipRow />          — optional metadata badges (rank / pos / cefr)
//   <WordHeading />      — the word itself
//   <MeaningBlock />     — optional meaning + translation
//   <PronRow natural />  — optional weak-form IPA + listen
//   <PronRow completa /> — optional IPA + listen (word audio)
//   <SentenceBlock />    — optional example + listen + sentence IPA
//   <Actions />          — Continuar + optional skip link
// </StudyCard>

import { ListenButton } from '@/components/ui/ListenButton'
import { PracticeActionBar, PracticeContinueButton } from '@/components/practice/session/PracticeActionBar'
import { ArchiveConfirmAction } from './ArchiveConfirmAction'
import { cn } from '@/lib/cn'
import type { StudyCardModel } from '@/lib/practice/study-card/model'
import type { CompiledMarkedText } from '@/lib/essential-words/study-markup'

/** What the user asked to hear — the parent maps this to a TTS string or audio_url. */
export type ListenTarget = 'word' | 'weak' | 'sentence'

interface Props {
  model: StudyCardModel
  onContinue: () => void
  onListen: (target: ListenTarget) => void
  /** Plays validated study content; its default text is compiled from the visible copy. */
  onListenText?: (text: string) => void
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

function MarkedText({
  value,
  className,
  targetWord,
}: {
  value: CompiledMarkedText
  className?: string
  /** Primary color is reserved for the target word, never generic emphasis. */
  targetWord?: string
}) {
  const parts: React.ReactNode[] = []
  let cursor = 0
  for (const [index, highlight] of value.highlights.entries()) {
    if (cursor < highlight.start) parts.push(value.text.slice(cursor, highlight.start))
    const marked = value.text.slice(highlight.start, highlight.end)
    const isTarget = targetWord != null && marked.toLowerCase() === targetWord.toLowerCase()
    parts.push(
      <mark key={`${highlight.start}:${highlight.end}:${index}`} className={cn('bg-transparent font-semibold', isTarget ? 'text-primary' : 'text-fg')}>
        {marked}
      </mark>,
    )
    cursor = highlight.end
  }
  if (cursor < value.text.length) parts.push(value.text.slice(cursor))
  return <span className={className}>{parts}</span>
}

function StudyListenButton({ onPlay, label, className }: { onPlay: () => void; label: string; className?: string }) {
  return (
    <ListenButton
      iconOnly
      className={cn('border-transparent', className)}
      onPlay={onPlay}
      aria-label={label}
    />
  )
}

function restatesRule(definitionEs: string | undefined, usageRuleEs: string | undefined): boolean {
  if (!definitionEs || !usageRuleEs) return false
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
  return normalize(usageRuleEs).includes(normalize(definitionEs))
}

function spanishList(items: string[]): string {
  if (items.length < 3) return items.join(' y ')
  return `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`
}

function StudyContent({ model, word, onListenText }: { model: NonNullable<StudyCardModel['study']>; word: string; onListenText?: (text: string) => void }) {
  const play = (text: string) => onListenText?.(text)
  const showPronunciation = model.pronunciation && (model.pronunciation.soundAnchors.length > 0 || model.pronunciation.variants.length > 0)
  const showDefinition = Boolean(model.definitionEs) && !restatesRule(model.definitionEs, model.usageRuleEs)
  const hasRuleOrContrast = Boolean(model.usageRuleEs || model.contrasts)

  return (
    <div className="flex w-full flex-col gap-layout-stack border-t border-border-subtle pt-layout-stack text-left">
      {(model.translation || model.translationNote || showDefinition) && (
        <div className="flex flex-col gap-1 text-center">
          {model.translation ? <p className="m-0 text-body-sm font-medium text-fg-muted">{spanishList(model.translation)}</p> : null}
          {model.translationNote ? <p className="m-0 text-body-sm text-fg-muted">{model.translationNote}</p> : null}
          {showDefinition ? <p className="m-0 text-body-sm text-fg-muted">{model.definitionEs}</p> : null}
          {model.spellingVariants?.map((variant) => (
            <p key={variant.spelling} className="m-0 text-caption text-fg-muted">
              También: <span className="font-medium text-fg">{variant.spelling}</span> ({variant.localeEs})
            </p>
          ))}
        </div>
      )}

      {showPronunciation ? (
        <details className="group w-full">
          <summary className="cursor-pointer text-label text-fg marker:text-fg-subtle focus-ring">
            Cómo suena
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            {model.pronunciation?.soundAnchors.map((anchor) => (
              <p key={anchor.id} className="m-0 text-body-sm text-fg-muted">
                <span className="font-ipa font-semibold text-fg">{anchor.ipa}</span>{' · '}{anchor.explanationEs}
              </p>
            ))}
            {model.pronunciation?.variants.map((variant) => (
              <div key={variant.id} className="flex items-center gap-3">
                <StudyListenButton onPlay={() => play(variant.ttsText)} label={`Escuchar ${variant.labelEs.toLowerCase()}`} />
                <div className="min-w-0 flex-1">
                  <p className="m-0 text-label text-fg">{variant.labelEs}</p>
                  <p className="m-0 text-body-sm text-fg-muted"><MarkedText value={variant.spokenExample} targetWord={word} /> <span className="font-ipa text-caption">{variant.ipa}</span></p>
                </div>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {hasRuleOrContrast ? (
        <section className="mt-2 flex flex-col gap-3" aria-label={model.contrasts?.titleEs ?? 'Regla'}>
          {model.usageRuleEs ? (
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-label text-fg">Cuándo se usa</h3>
              <p className="m-0 text-body-md font-medium text-fg">{model.usageRuleEs}</p>
            </div>
          ) : null}
          {model.contrasts?.pairs.map((pair, index) => (
            <div key={index} className="flex items-start gap-3 rounded-md bg-surface-base px-3 py-3">
              <StudyListenButton className="mt-0.5" onPlay={() => play(pair.ttsText)} label="Escuchar ejemplo en inglés" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-body-sm text-fg-muted"><MarkedText value={pair.spanish} /></p>
                <p className="m-0 text-body-md text-fg"><MarkedText value={pair.english} targetWord={word} /></p>
                {pair.pattern === 'omission' ? <p className="m-0 mt-1 text-caption text-fg-muted">Aquí no va “{word}”.</p> : null}
                {pair.explanationEs ? <p className="m-0 mt-1 text-caption text-fg-muted">{pair.explanationEs}</p> : null}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {model.examples?.length ? (
        <section className="flex flex-col gap-2" aria-label="Ejemplos">
          <h3 className="m-0 text-label text-fg">Ejemplos</h3>
          {model.examples.map((example, index) => (
            <div key={index} className="flex items-start gap-2">
              <StudyListenButton onPlay={() => play(example.ttsText)} label="Escuchar oración" />
              <div className="min-w-0 flex-1">
                <p className="m-0 text-body-md text-fg"><MarkedText value={example.english} targetWord={word} /></p>
                <p className="m-0 text-body-sm text-fg-muted">{example.translationEs}</p>
              </div>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  )
}

function StudyCardBody({
  model,
  onListen,
  onListenText,
  immersive,
}: {
  model: StudyCardModel
  onListen: (target: ListenTarget) => void
  onListenText?: (text: string) => void
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

      {model.study ? <StudyContent model={model.study} word={model.word} onListenText={onListenText} /> : <>

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
                  label="completa"
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
                    label="Completa"
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
      </>}
    </div>
  )
}

export function StudyCard({
  model,
  onContinue,
  onListen,
  onListenText,
  continueLabel = 'Continuar',
  variant = 'default',
  contextLine,
  onOmit,
  // "Sáltala" prometía omitir y luego se verificaba igualmente. El claim abre
  // una comprobación corta, por eso el copy no promete saltarse la palabra.
  omitLabel = 'Ya conozco esta palabra',
  onArchive,
}: Props) {
  const immersive = variant === 'immersive'

  const body = (
    <>
      {immersive && contextLine ? (
        <p className="m-0 text-center text-caption text-fg-muted">{contextLine}</p>
      ) : null}
      {model.srsBadge ? (
        <span className="font-kicker text-primary">{model.srsBadge}</span>
      ) : null}
      <StudyCardBody model={model} onListen={onListen} onListenText={onListenText} immersive={immersive} />
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

      <PracticeActionBar className={immersive ? undefined : 'max-w-sm'}>
        <PracticeContinueButton onClick={onContinue}>{continueLabel}</PracticeContinueButton>
        {onOmit ? (
          <button
            type="button"
            onClick={onOmit}
            className="mt-1 inline-flex min-h-11 min-w-11 self-center items-center justify-center rounded-lg border-none bg-transparent px-3 py-2 text-body-sm font-normal text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg focus-ring"
          >
            {omitLabel}
          </button>
        ) : null}
        {!onOmit && onArchive ? <ArchiveConfirmAction onArchive={onArchive} /> : null}
      </PracticeActionBar>
    </div>
  )
}
