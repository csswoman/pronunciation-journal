'use client'

// Planned structure:
// <SessionReadyLeeches> warning + chips + CTA </SessionReadyLeeches>

import { AlertCircle } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import type { LeechWord } from '@/lib/essential-words/ready-leeches'
import { SessionSurface } from './session-chrome'

interface Props {
  leeches: LeechWord[]
  onReview: (wordIds: string[]) => void
  disabled?: boolean
}

export function SessionReadyLeeches({ leeches, onReview, disabled = false }: Props) {
  if (leeches.length === 0) return null
  const preview = leeches.slice(0, 3)

  return (
    <SessionSurface density="compact">
      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="shrink-0 text-warning" aria-hidden />
        <h3 className="m-0 font-label text-fg">Se te resisten</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {preview.map((leech) => (
          <span
            key={leech.wordId}
            className="rounded-full bg-warning-soft px-3 py-1.5 text-caption text-warning"
          >
            {displayEnglishWord(leech.word)}
          </span>
        ))}
      </div>
      <PillButton
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onReview(leeches.map((l) => l.wordId))}
        disabled={disabled}
        className="w-full"
      >
        Repasar las {leeches.length} difíciles →
      </PillButton>
    </SessionSurface>
  )
}
