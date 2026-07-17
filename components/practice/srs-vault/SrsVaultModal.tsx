'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { filterVaultEntries, type VaultFilter } from '@/lib/srs/vault'
import type { SRSData } from '@/lib/types'
import { SrsVaultFilters } from './SrsVaultFilters'
import { SrsVaultRow } from './SrsVaultRow'

type SrsVaultModalProps = {
  open: boolean
  onClose: () => void
  entries: SRSData[]
}

function emptyMessage(filter: VaultFilter, query: string): string {
  const trimmed = query.trim()
  if (trimmed) return `Sin resultados para «${trimmed}»`
  if (filter === 'snoozed') return 'No hay palabras en pausa'
  if (filter === 'mastered') return 'No hay palabras dominadas'
  return 'El baúl está vacío'
}

export function SrsVaultModal({ open, onClose, entries }: SrsVaultModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [filter, setFilter] = useState<VaultFilter>('all')
  const [query, setQuery] = useState('')

  const filteredEntries = useMemo(
    () => filterVaultEntries(entries, filter, query),
    [entries, filter, query],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open) {
      if (!dialog.open) dialog.showModal()
      return
    }
    if (dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  useEffect(() => {
    if (!open) {
      setFilter('all')
      setQuery('')
    }
  }, [open])

  const message = emptyMessage(filter, query)

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'm-auto w-[min(100%,32rem)] max-h-[80vh] overflow-auto rounded-lg',
        'border border-border-subtle bg-surface-raised p-4 text-fg shadow-lg',
        '[&::backdrop]:fixed [&::backdrop]:inset-0 [&::backdrop]:bg-black/40',
        '[&::backdrop]:backdrop-blur-sm motion-reduce:[&::backdrop]:backdrop-blur-none',
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="m-0 text-lg font-semibold text-fg">Baúl</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="font-caption text-fg-muted transition-colors hover:text-fg"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <label className="flex flex-col gap-1">
          <span className="sr-only">Buscar palabra</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar palabra…"
            className="rounded-lg border border-border-default bg-surface-sunken px-3 py-2 text-sm text-fg focus-ring"
          />
        </label>

        <SrsVaultFilters value={filter} onChange={setFilter} />

        {filteredEntries.length > 0 ? (
          <div className="flex flex-col">
            {filteredEntries.map((entry) => (
              <SrsVaultRow key={entry.wordId} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="m-0 text-sm text-fg-muted">{message}</p>
        )}
      </div>
    </dialog>
  )
}
