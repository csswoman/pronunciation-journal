'use client'

// Planned structure:
// <SessionReadyVaultRow>
//   title + word chips + chevron → <SrsVaultModal />
// </SessionReadyVaultRow>

import { useState } from 'react'
import { Bookmark, ChevronRight } from '@/components/icons'
import { useSrsVaultEntries } from '@/hooks/useSrsVaultEntries'
import { SrsVaultModal } from '@/components/practice/srs-vault/SrsVaultModal'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import { cn } from '@/lib/cn'
import { SessionSurface } from './session-chrome'

export function SessionReadyVaultRow() {
  const vaultEntries = useSrsVaultEntries()
  const [open, setOpen] = useState(false)
  const count = vaultEntries.length

  if (count === 0) return null

  const preview = vaultEntries.slice(0, 3)
  const noun = count === 1 ? 'palabra' : 'palabras'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full text-left focus-ring"
      >
        <SessionSurface className="gap-layout-stack transition-colors hover:bg-surface-sunken">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted"
              aria-hidden
            >
              <Bookmark size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-label text-fg">Baúl</span>
              <span className="block text-caption text-fg-muted">
                {count} {noun} guardadas
              </span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-fg-subtle" aria-hidden />
          </div>
          <div className="flex flex-wrap gap-2">
            {preview.map((entry) => (
              <span
                key={entry.wordId}
                className={cn(
                  'rounded-full bg-surface-raised px-3 py-1 text-caption text-fg-muted',
                )}
              >
                {displayEnglishWord(entry.word)}
              </span>
            ))}
          </div>
        </SessionSurface>
      </button>
      <SrsVaultModal open={open} onClose={() => setOpen(false)} entries={vaultEntries} />
    </>
  )
}
