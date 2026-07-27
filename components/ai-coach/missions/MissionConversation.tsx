'use client'

import { RemediationSequence } from '@/components/pronunciation-feedback/RemediationSequence'
import type { FeedbackPriority } from '@/lib/pronunciation/feedback/types'

interface MissionConversationProps {
  pendingCorrection: FeedbackPriority | null
  onListen: () => void
  onSlow: () => void
  onRetry: () => void
}

export function MissionConversation({ pendingCorrection, onListen, onSlow, onRetry }: MissionConversationProps) {
  if (!pendingCorrection) return null

  return (
    <RemediationSequence
      cue={pendingCorrection.cueEs}
      onListen={onListen}
      onSlow={onSlow}
      onRetry={onRetry}
    />
  )
}
