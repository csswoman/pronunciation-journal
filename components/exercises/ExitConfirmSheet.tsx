'use client'

// Planned structure:
// <ExitConfirmSheet>
//   <Backdrop />   — blur overlay, click/Escape cancels
//   <Panel />      — mobile: bottom sheet; sm+: centered modal (same JSX, different positioning)

import { useEffect, useRef } from 'react'

interface ExitConfirmSheetProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  backdrop?: boolean
}

export function ExitConfirmSheet({ open, onConfirm, onCancel }: ExitConfirmSheetProps) {
  const firstButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    firstButtonRef.current?.focus()
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-dialog-title"
      className="absolute inset-0 z-50 flex items-end sm:items-center sm:justify-center"
    >
      {/* Blur backdrop */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onCancel}
        className="absolute inset-0 bg-(--page-bg)/60 backdrop-blur-md cursor-default w-full h-full"
      />

      {/* Panel: bottom sheet on mobile, centered modal on sm+ */}
      <div className="relative z-10 w-full sm:max-w-sm bg-(--card-bg) rounded-t-2xl sm:rounded-2xl px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 flex flex-col gap-6 sm:shadow-xl sm:mx-4">
        {/* Header */}
        <div className="flex flex-col gap-1.5">
          <h2 id="exit-dialog-title" className="text-lg font-semibold leading-snug tracking-tight text-(--fg)">
            Quit this session?
          </h2>
          <p className="text-[13px] text-(--fg-muted) leading-relaxed">
            You&apos;ll lose your progress in this session.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            ref={firstButtonRef}
            type="button"
            onClick={onConfirm}
            className="w-full rounded-md py-3 text-[14px] font-semibold bg-error-soft text-error border border-(--error)/30 transition-colors hover:bg-error-solid hover:text-white hover:border-transparent cursor-pointer"
          >
            End session
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-md py-3 text-[14px] font-semibold bg-(--cta-bg) text-(--cta-fg) transition-opacity hover:opacity-85 cursor-pointer"
          >
            Keep practicing
          </button>
        </div>
      </div>
    </div>
  )
}
