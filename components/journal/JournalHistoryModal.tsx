'use client'

// Planned structure:
// <JournalHistoryModal>
//   <ModalBackdrop />
//   <ModalContainer:
//     <ModalHeader: title, subtitle, close button />
//     <JournalHistoryList userId excludeDate />
//   />
// </JournalHistoryModal>

import { useEffect } from 'react'
import { X } from '@/components/icons'
import { JournalHistoryList } from './JournalHistoryList'

interface JournalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  excludeDate?: string
}

export function JournalHistoryModal({ isOpen, onClose, userId, excludeDate }: JournalHistoryModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="journal-history-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 sm:p-6 animate-in fade-in-0 duration-200"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col gap-5 rounded-3xl border border-border-default bg-surface-raised p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-subtle pb-5">
          <div className="flex flex-col gap-1 min-w-0">
            <h2
              id="journal-history-modal-title"
              className="font-heading text-h1 font-extrabold text-fg tracking-tight leading-tight"
            >
              Páginas anteriores
            </h2>
            <p className="font-sans text-body-sm sm:text-body-md text-fg-muted">
              Todas las páginas que has escrito, con sus correcciones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="focus-ring inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-raised text-fg hover:bg-surface-sunken transition-colors cursor-pointer select-none"
          >
            <X size={20} aria-hidden />
          </button>
        </div>

        <JournalHistoryList userId={userId} excludeDate={excludeDate} />
      </div>
    </div>
  )
}
