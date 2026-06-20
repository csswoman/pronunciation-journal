'use client'

import { MessageCircle, Mic } from 'lucide-react'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import type { SessionArc } from '@/lib/practice/types'

// Planned structure:
// <SpeakWithCoachCard> — heading + two buttons (chat / voice interview)

interface Props {
  arc: SessionArc | undefined
}

export default function SpeakWithCoachCard({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border-subtle bg-surface-raised p-4">
      <div>
        <p className="font-body-sm font-semibold text-[var(--text-primary)]">
          Speak it out loud
        </p>
        <p className="font-caption text-[var(--text-tertiary)]">
          Practice today&apos;s words in a real conversation with the coach.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill })}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-2.5 font-body-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hue-icon-bg)] focus-ring"
        >
          <MessageCircle size={15} aria-hidden />
          Conversa sobre esto
        </button>
        <button
          type="button"
          onClick={() => openCoach({ tab: 'interview', prefill })}
          className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-sunken px-4 py-2.5 font-body-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--hue-icon-bg)] focus-ring"
        >
          <Mic size={15} aria-hidden />
          Entrevista por voz
        </button>
      </div>
    </div>
  )
}
