// components/pronunciation-feedback/ListenPanel.tsx
'use client'

// Planned structure:
// <ListenPanel>  — one card, merges the two old audio cards
//   row 1: "ESCUCHA LA DIFERENCIA" + minimal-pair chips
//   row 2: Nativo / Mi voz buttons (useDualPlayback)

import { Volume2, Mic, Pause } from '@/components/icons'
import { speak } from '@/lib/phoneme-practice/tts'
import { cn } from '@/lib/cn'
import { useDualPlayback } from '@/hooks/useDualPlayback'

interface Props {
  minimalPairs: { wordA: string; wordB: string }[]
  targetText: string
  userAudioUrl: string | null | undefined
}

export function ListenPanel({ minimalPairs, targetText, userAudioUrl }: Props) {
  const { isPlayingNative, isPlayingUser, playNative, playUser } = useDualPlayback(
    targetText,
    userAudioUrl,
  )
  const pairs = minimalPairs.slice(0, 2)

  return (
    <div className="flex w-full flex-col gap-2.5 rounded-xl border border-border-default bg-surface-raised p-3.5">
      {pairs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-xs uppercase tracking-wider text-fg-muted">
            Escucha la diferencia
          </span>
          {pairs.flatMap((pair) => [
            <button
              key={`${pair.wordA}-a`}
              type="button"
              onClick={() => speak(pair.wordA)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordA}
            </button>,
            <button
              key={`${pair.wordB}-b`}
              type="button"
              onClick={() => speak(pair.wordB)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordB}
            </button>,
          ])}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={playNative}
          disabled={!targetText}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border-default bg-surface-base px-3 py-2 text-caption font-semibold text-fg hover:bg-surface-sunken transition-colors',
            isPlayingNative && 'border-primary text-primary animate-pulse',
          )}
          aria-label="Escuchar modelo nativo"
        >
          <Volume2 size={16} className={isPlayingNative ? 'text-primary' : 'text-fg-muted'} />
          <span>Nativo</span>
        </button>

        <button
          type="button"
          onClick={playUser}
          disabled={!userAudioUrl}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-caption font-semibold transition-colors',
            userAudioUrl
              ? 'border-primary/40 bg-primary-soft text-primary hover:bg-primary/20'
              : 'border-border-subtle bg-surface-sunken text-fg-muted opacity-50 cursor-not-allowed',
            isPlayingUser && 'border-primary ring-2 ring-primary/30',
          )}
          aria-label="Escuchar mi propia voz grabada"
        >
          {isPlayingUser ? <Pause size={16} /> : <Mic size={16} />}
          <span>Mi voz</span>
        </button>
      </div>
    </div>
  )
}
