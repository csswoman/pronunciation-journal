'use client'

import { useState } from 'react'
import { Bookmark, ChevronRight } from '@/components/icons'
import { useSrsVaultEntries } from '@/hooks/useSrsVaultEntries'
import { SrsVaultModal } from '@/components/practice/srs-vault/SrsVaultModal'
import { displayEnglishWord } from '@/lib/essential-words/word-display'

export function SessionReadyVaultRow() {
  const vaultEntries = useSrsVaultEntries()
  const [open, setOpen] = useState(false)
  const realCount = vaultEntries.length
  const noun = realCount === 1 ? 'palabra guardada' : 'palabras guardadas'

  const previewWords = vaultEntries.slice(0, 3).map((e) => displayEnglishWord(e.word))

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full flex-col gap-3 rounded-3xl border border-border-default bg-surface-raised hover:bg-surface-sunken p-5 text-left text-fg transition-all duration-150 hover:border-border-muted cursor-pointer shadow-xs animate-home-in"
      >
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning p-2.5"
            aria-hidden
          >
            <Bookmark size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-base text-fg">Tu baúl</span>
            <span className="block text-xs sm:text-sm text-fg-muted">
              {realCount} {noun}
            </span>
          </span>
          <ChevronRight
            size={18}
            className="shrink-0 text-fg-subtle transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </div>
        {previewWords.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-0.5">
            {previewWords.map((word, idx) => (
              <span
                key={idx}
                className="rounded-full bg-surface-sunken border border-border-subtle text-fg text-xs sm:text-sm px-3 py-1 font-medium"
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-fg-muted m-0">
            Guarda palabras difíciles para repasarlas cuando quieras.
          </p>
        )}
      </button>
      <SrsVaultModal open={open} onClose={() => setOpen(false)} entries={vaultEntries} />
    </>
  )
}
