'use client'

// Planned structure:
// <CoachCallCard>
//   header: kicker + "Micrófono" badge
//   title + description
//   actions: conversa / misión oral
// </CoachCallCard>

import { MessageCircle, Mic } from '@/components/icons'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import type { SessionArc } from '@/lib/practice/types'

interface Props {
  arc?: SessionArc
}

// Planned structure:
// <CoachCallCard> — "Coach de conversación" bento card with mic icon, actions, and chat graphic

export default function CoachCallCard({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  return (
    <div
      data-testid="speak-with-coach"
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-colors hover:border-border-strong h-full overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-primary">
            <Mic size={18} aria-hidden />
          </span>
          <h2 className="text-h3 font-bold text-fg">Coach de conversación</h2>
        </div>

        <p className="text-body-sm text-fg-muted text-pretty">
          Habla en voz alta y recibe corrección en tiempo real.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCoach({ tab: 'chat', prefill })}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3.5 py-2.5 font-label text-body-xs font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken active:translate-y-[-1px]"
          >
            <MessageCircle size={14} aria-hidden />
            <span>Conversa</span>
          </button>
          <button
            type="button"
            onClick={() => openCoach({ tab: 'missions', prefill })}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3.5 py-2.5 font-label text-body-xs font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken active:translate-y-[-1px]"
          >
            <Mic size={14} aria-hidden />
            <span>Misión oral</span>
          </button>
        </div>
      </div>

      {/* Chat bubbles illustration (bottom right) */}
      <div className="absolute right-3 bottom-3 hidden sm:flex flex-col gap-1.5 opacity-40 transition-opacity group-hover:opacity-70">
        <div className="h-4 w-12 rounded-lg rounded-br-xs bg-border-strong/50" />
        <div className="h-5 w-16 rounded-lg rounded-bl-xs bg-primary/40 ml-4" />
      </div>
    </div>
  )
}

