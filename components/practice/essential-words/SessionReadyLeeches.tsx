'use client'

// Planned structure:
// <SessionReadyLeeches> warning + chips + CTA </SessionReadyLeeches>

import { AlertCircle } from '@/components/icons'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import type { LeechWord } from '@/lib/essential-words/ready-leeches'
import { SessionSurface } from './session-chrome'

interface Props {
  leeches: LeechWord[]
  onReview: (wordIds: string[]) => void
}

export function SessionReadyLeeches({ leeches, onReview }: Props) {
  if (leeches.length === 0) return null
  const preview = leeches.slice(0, 3)

  return (
    <SessionSurface className="gap-layout-stack">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-warning" aria-hidden />
        <h3 className="m-0 font-label text-fg">Se te resisten</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {preview.map((leech) => (
          <span
            key={leech.wordId}
            className="rounded-full bg-warning-soft px-3 py-1 text-caption text-warning"
          >
            {displayEnglishWord(leech.word)}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onReview(leeches.map((l) => l.wordId))}
        className="text-left text-caption font-semibold text-primary focus-ring hover:underline"
      >
        Repasar las {leeches.length} difíciles →
      </button>
    </SessionSurface>
  )
}
