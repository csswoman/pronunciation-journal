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
        className="group flex w-full flex-col gap-layout-stack-tight rounded-xl border border-border-subtle bg-daily-card p-[var(--layout-card-pad)] text-left transition-colors duration-150 ease-out-quart hover:bg-surface-sunken focus-ring active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted"
            aria-hidden
          >
            <Bookmark size={16} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-label text-fg">Baúl</span>
            <span className="block text-caption tabular-nums text-fg-muted">
              {count} {noun} guardadas
            </span>
          </span>
          <ChevronRight
            size={16}
            className="shrink-0 text-fg-subtle transition-transform duration-150 ease-out-quart group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            aria-hidden
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {preview.map((entry) => (
            <span
              key={entry.wordId}
              className="rounded-full bg-surface-sunken px-3 py-1.5 text-caption text-fg-muted"
            >
              {displayEnglishWord(entry.word)}
            </span>
          ))}
        </div>
      </button>
      <SrsVaultModal open={open} onClose={() => setOpen(false)} entries={vaultEntries} />
    </>
  )
}
