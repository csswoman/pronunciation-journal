'use client'

// Planned structure:
// <SessionLoadingShell>
//   <PhonemeFocusShell>  (when focusUi mode)
//     <WordCarousel />
//   </PhonemeFocusShell>
//   plain wrapper div    (otherwise)
//     <WordCarousel />
// </SessionLoadingShell>

'use client'

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
        badge={displayBadge}
        progressPct={0}
        onExit={onExit}
      >
        <WordCarousel words={words} />
      </PhonemeFocusShell>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <WordCarousel words={words} />
    </div>
  )
}
