'use client'

// Planned structure:
// <CoachCallCard>
//   header: hand-drawn chip + kicker + title
//   description
//   actions: conversa / misión oral
//   illustration: hand-drawn watermark, bottom-right
// </CoachCallCard>

import { MessageCircle, Mic } from '@/components/icons'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import { getIllustration } from '@/lib/illustrations/registry'
import type { SessionArc } from '@/lib/practice/types'

const Illustration = getIllustration('domainSpeaking')

interface Props {
  arc?: SessionArc
}

export default function CoachCallCard({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  return (
    <div
      data-testid="speak-with-coach"
      className="group relative flex flex-col justify-between gap-5 rounded-[var(--radius-lg)] border border-border-default bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:border-border-strong hover:shadow-sm overflow-hidden"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[var(--hue-icon-bg)] text-primary [&>svg]:h-5 [&>svg]:w-auto">
            <Illustration aria-hidden />
          </span>
          <span className="font-kicker text-tiny uppercase tracking-wider text-fg-subtle">libre</span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-h3 font-bold text-fg">Coach de conversación</h2>
          <p className="text-body-sm text-fg-muted text-pretty">
            Habla en voz alta y recibe corrección al instante.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2 z-10">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => openCoach({ tab: 'chat', prefill })}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3.5 py-2.5 font-label text-body-xs font-semibold text-fg transition-transform duration-150 hover:bg-surface-sunken active:scale-[0.98]"
          >
            <MessageCircle size={14} aria-hidden />
            <span>Conversa</span>
          </button>
          <button
            type="button"
            onClick={() => openCoach({ tab: 'missions', prefill })}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-border-default bg-surface-raised px-3.5 py-2.5 font-label text-body-xs font-semibold text-fg transition-transform duration-150 hover:bg-surface-sunken active:scale-[0.98]"
          >
            <Mic size={14} aria-hidden />
            <span>Misión oral</span>
          </button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-3 bottom-2 hidden text-primary/15 transition-colors duration-200 group-hover:text-primary/25 sm:block [&>svg]:h-20 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </div>
  )
}
