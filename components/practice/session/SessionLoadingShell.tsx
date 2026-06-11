'use client'

// Planned structure:
// <SessionLoadingShell>
//   <PhonemeFocusShell>  (when focusUi mode)
//     spinner div
//   </PhonemeFocusShell>
//   plain wrapper div    (otherwise)
// </SessionLoadingShell>

import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'

interface SessionLoadingShellProps {
  focusUi: boolean
  displayBadge: string
  onExit: () => void
}

export function SessionLoadingShell({ focusUi, displayBadge, onExit }: SessionLoadingShellProps) {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div
        className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin"
        aria-hidden
      />
      <span className="text-sm text-fg-secondary">Cargando sesión…</span>
    </div>
  )

  if (focusUi && displayBadge) {
    return (
      <PhonemeFocusShell
        badge={displayBadge}
        progressPct={0}
        onExit={onExit}
      >
        {spinner}
      </PhonemeFocusShell>
    )
  }

  return <div className="w-full max-w-md mx-auto p-8">{spinner}</div>
}
