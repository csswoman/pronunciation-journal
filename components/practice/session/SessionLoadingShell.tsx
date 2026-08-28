'use client'

// Planned structure:
// <SessionLoadingShell>
//   <PhonemeFocusShell>  (when focusUi mode)
//     <WordCarousel />
//   </PhonemeFocusShell>
//   plain wrapper div    (otherwise)
//     <WordCarousel />
// </SessionLoadingShell>

import { PhonemeFocusShell } from '@/components/phoneme-practice/PhonemeFocusShell'
import { WordCarousel } from './WordCarousel'
import { useLoadingWords } from '@/hooks/useLoadingWords'

interface SessionLoadingShellProps {
  focusUi: boolean
  displayBadge: string
  onExit: () => void
}

export function SessionLoadingShell({ focusUi, displayBadge, onExit }: SessionLoadingShellProps) {
  const words = useLoadingWords()

  if (focusUi && displayBadge) {
    return (
      <PhonemeFocusShell
        progressPct={0}
        stepCurrent={1}
        stepTotal={1}
        onExit={onExit}
      >
        <WordCarousel words={words} />
      </PhonemeFocusShell>
    )
  }

  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-layout-session-max flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-border-subtle bg-surface-raised p-8 shadow-xs">
        <WordCarousel words={words} />
      </div>
    </div>
  )
}
