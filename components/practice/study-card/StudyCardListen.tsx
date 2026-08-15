'use client'

import { ListenButton } from '@/components/ui/ListenButton'
import { cn } from '@/lib/cn'

// Planned structure:
// <ImmersiveListenGroup>
//   <ImmersiveListenRow />
//   <PronRow />
//   <SentenceBlock />
// </ImmersiveListenGroup>
// <StudyListenButton />

export function ImmersiveListenGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-3">{children}</div>
}

export function ImmersiveListenRow({
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

export function PronRow({
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

export function SentenceBlock({
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

export function StudyListenButton({ onPlay, label, className }: { onPlay: () => void; label: string; className?: string }) {
  return (
    <ListenButton
      iconOnly
      className={cn('border-transparent', className)}
      onPlay={onPlay}
      aria-label={label}
    />
  )
}
