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
        'm-auto max-h-[85vh] w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl p-0',
        'border border-border-subtle bg-surface-raised text-fg shadow-lg',
        'md:max-w-4xl',
        '[&::backdrop]:fixed [&::backdrop]:inset-0 [&::backdrop]:bg-black/40',
        '[&::backdrop]:backdrop-blur-sm motion-reduce:[&::backdrop]:backdrop-blur-none',
      )}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-border-subtle px-4 py-4 md:px-6">
          <div className="min-w-0">
            <h2 className="m-0 text-body-lg font-semibold text-fg">Baúl</h2>
            <p className="m-0 mt-1 text-caption text-fg-muted">
              {filteredEntries.length === entries.length
                ? `${entries.length} ${entries.length === 1 ? 'palabra' : 'palabras'}`
                : `${filteredEntries.length} de ${entries.length} palabras`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="min-h-11 rounded-md px-3 font-caption text-fg-muted transition-colors hover:text-fg focus-ring"
            aria-label="Cerrar"
          >
            Cerrar
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-border-subtle px-4 py-3 md:flex-row md:items-center md:px-6">
          <label className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="sr-only">Buscar palabra</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar palabra…"
              className="rounded-md border border-border-default bg-surface-sunken px-3 py-2 text-body-sm text-fg focus-ring"
            />
          </label>

          <SrsVaultFilters value={filter} onChange={setFilter} />
        </div>

        {filteredEntries.length > 0 ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 md:px-6">
            {filteredEntries.map((entry) => (
              <SrsVaultRow key={entry.wordId} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="m-0 px-4 py-6 text-body-sm text-fg-muted md:px-6">{message}</p>
        )}
      </div>
    </dialog>
  )
}
