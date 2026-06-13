'use client'

// Planned structure:
// <ExitConfirmSheet>
//   <Backdrop />    — fixed overlay, click cancels
//   <Sheet />       — bottom panel with title, subtitle, two buttons

interface ExitConfirmSheetProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ExitConfirmSheet({ open, onConfirm, onCancel }: ExitConfirmSheetProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onCancel}
        className="absolute inset-0 bg-black/40 cursor-default"
      />
      <div className="relative z-10 rounded-t-[var(--radius-xl)] bg-surface px-6 pb-10 pt-6 shadow-xl flex flex-col gap-4">
        <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-border-subtle" />
        <h2 className="text-[18px] font-bold text-fg">Quit this session?</h2>
        <p className="text-[14px] text-fg-muted leading-snug">
          You&apos;ll lose your progress in this session.
        </p>
        <button
          type="button"
          onClick={onConfirm}
          className="w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold bg-error text-white transition-opacity hover:opacity-90 cursor-pointer"
        >
          End session
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-[var(--radius-full)] py-3.5 text-[15px] font-semibold bg-surface-raised text-fg transition-opacity hover:opacity-80 cursor-pointer"
        >
          Keep practicing
        </button>
      </div>
    </div>
  )
}
