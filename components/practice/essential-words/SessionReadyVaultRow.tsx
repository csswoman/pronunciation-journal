'use client'

// Planned structure:
// <SessionReadyVaultRow>
//   icon + title/subtitle + chevron → opens <SrsVaultModal />
// </SessionReadyVaultRow>

import { useState } from 'react'
import { Bookmark, ChevronRight } from '@/components/icons'
import { useSrsVaultEntries } from '@/hooks/useSrsVaultEntries'
import { SrsVaultModal } from '@/components/practice/srs-vault/SrsVaultModal'
import { cn } from '@/lib/cn'

export function SessionReadyVaultRow() {
  const vaultEntries = useSrsVaultEntries()
  const [open, setOpen] = useState(false)
  const count = vaultEntries.length

  if (count === 0) return null

  const noun = count === 1 ? 'palabra' : 'palabras'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'w-full rounded-xl border border-border-subtle bg-daily-card text-left focus-ring',
          'px-[var(--layout-card-pad)] py-4 transition-colors hover:bg-surface-sunken',
        )}
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
            <span className="block text-caption text-fg-muted">
              {count} {noun} guardadas para más tarde
            </span>
          </span>
          <ChevronRight size={16} className="shrink-0 text-fg-subtle" aria-hidden />
        </div>
      </button>
      <SrsVaultModal open={open} onClose={() => setOpen(false)} entries={vaultEntries} />
    </>
  )
}
