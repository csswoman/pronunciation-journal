'use client'

// Planned structure:
// <ExitConfirmSheet>
//   <Backdrop />   — blur overlay, click cancels
//   <Sheet />      — bottom-anchored panel: header group, action group

interface ExitConfirmSheetProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  backdrop?: boolean
}

export function ExitConfirmSheet({ open, onConfirm, onCancel }: ExitConfirmSheetProps) {
  if (!open) return null

  return (
    <div className="absolute inset-0 z-50 flex items-end">
      {/* Blur backdrop */}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onCancel}
        className="absolute inset-0 bg-[var(--page-bg)]/60 backdrop-blur-md cursor-default"
      />

      {/* Bottom sheet panel */}
      <div className="relative z-10 w-full bg-[var(--card-bg)] rounded-t-[var(--radius-2xl)] px-6 pt-6 pb-20 flex flex-col gap-6 border-none">
        {/* Header group */}
        <div className="flex flex-col gap-1.5">
          <h2 className="text-lg font-semibold leading-snug tracking-tight text-[var(--fg)]">
            Quit this session?
          </h2>
          <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed">
            You&apos;ll lose your progress in this session.
          </p>
        </div>

        {/* Action group */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-[var(--radius-md)] py-3 text-[14px] font-semibold bg-[var(--error-soft)] text-[var(--error)] border border-[var(--error)]/30 transition-colors hover:bg-[var(--error)] hover:text-white hover:border-transparent cursor-pointer"
          >
            End session
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full rounded-[var(--radius-md)] py-3 text-[14px] font-semibold bg-[var(--cta-bg)] text-[var(--cta-fg)] transition-opacity hover:opacity-85 cursor-pointer"
          >
            Keep practicing
          </button>
        </div>
      </div>
    </div>
  )
}
