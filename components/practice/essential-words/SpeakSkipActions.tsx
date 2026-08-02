'use client'

// Planned structure:
// <SpeakSkipActions>
//   <ArchiveConfirm />     — Ya la sé → confirma pausa 90d
//   <FromSnoozeActions />  — Seguir 90d / Dominar con confirmación
// </SpeakSkipActions>

import { useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { ArchiveConfirmAction } from '@/components/practice/study-card/ArchiveConfirmAction'

type Props = {
  onArchive: () => void
  fromSnooze?: boolean
  onKeepSnooze?: () => void
  onMaster?: () => void
}

export function SpeakSkipActions({
  onArchive,
  fromSnooze,
  onKeepSnooze,
  onMaster,
}: Props) {
  const [confirm, setConfirm] = useState<'master' | null>(null)

  if (confirm === 'master') {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="m-0 text-body-sm text-fg-muted">¿No volver a mostrarla?</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <PillButton variant="quiet" size="sm" onClick={onMaster}>
            Sí, dominada
          </PillButton>
          <PillButton variant="quiet" size="sm" onClick={() => setConfirm(null)}>
            Cancelar
          </PillButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col items-center gap-2 border-t border-border-subtle pt-4">
      <ArchiveConfirmAction onArchive={onArchive} />
      {fromSnooze && (
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={onKeepSnooze}
            className="min-h-11 border-none bg-transparent px-3 py-1 text-caption text-fg-muted transition-colors hover:text-fg focus-ring"
          >
            Seguir en 90 días
          </button>
          <span className="text-fg-subtle" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={() => setConfirm('master')}
            className="min-h-11 border-none bg-transparent px-3 py-1 text-caption text-fg-subtle transition-colors hover:text-fg-muted focus-ring"
          >
            No me la recuerdes más
          </button>
        </div>
      )}
    </div>
  )
}
