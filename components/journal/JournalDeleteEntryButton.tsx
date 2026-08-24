'use client'

// Planned structure:
// <JournalDeleteEntryButton>
//   idle:      <PillButton>Borrar página</PillButton>
//   confirming: <span>¿Seguro?</span> + <PillButton>Sí, borrar</PillButton> + <PillButton>Cancelar</PillButton>
// </JournalDeleteEntryButton>

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from '@/components/icons'
import { PillButton } from '@/components/ui/PillButton'
import { deleteJournalEntry } from '@/lib/journal/queries'
import type { JournalEntryRecord } from '@/lib/journal/types'
import { cn } from '@/lib/cn'

interface JournalDeleteEntryButtonProps {
  entry: JournalEntryRecord
  /** Ruta a la que navegar tras borrar. */
  redirectTo?: string
}

/** Two-step (confirm-then-commit) destructive action — no modal needed for a single record delete. */
export function JournalDeleteEntryButton({
  entry,
  redirectTo = '/journal',
}: JournalDeleteEntryButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleConfirmDelete() {
    if (isDeleting) return
    setIsDeleting(true)
    try {
      await deleteJournalEntry(entry)
      router.push(redirectTo)
    } catch {
      setIsDeleting(false)
      setConfirming(false)
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-body-sm text-fg-muted">¿Borrar esta página? No se puede deshacer.</span>
        <PillButton
          variant="outline"
          size="sm"
          className={cn('text-error hover:bg-error')}
          isLoading={isDeleting}
          onClick={() => void handleConfirmDelete()}
        >
          Sí, borrar
        </PillButton>
        <PillButton variant="quiet" size="sm" disabled={isDeleting} onClick={() => setConfirming(false)}>
          Cancelar
        </PillButton>
      </div>
    )
  }

  return (
    <PillButton
      variant="quiet"
      size="sm"
      icon={<Trash2 size={14} aria-hidden />}
      className="text-fg-subtle hover:text-error"
      onClick={() => setConfirming(true)}
    >
      Borrar página
    </PillButton>
  )
}
