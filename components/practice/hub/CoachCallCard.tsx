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

export default function CoachCallCard({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)

  return (
    <div
      data-testid="speak-with-coach"
      className="group/coach flex flex-col justify-between gap-3 rounded-2xl border border-border-subtle bg-surface-raised p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="font-kicker text-fg-subtle">Speaking en vivo</span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-primary-soft px-2.5 py-0.5 font-caption text-caption font-medium text-primary">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Micrófono
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--hue-icon-bg)] text-primary">
            <Mic size={22} aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-h4 font-bold text-fg">Coach de conversación</h3>
            <span className="font-caption text-caption text-fg-subtle">Retroalimentación inmediata</span>
          </div>
        </div>

        <p className="text-body-sm text-fg-muted text-pretty">
          Habla en voz alta sobre tus temas de hoy y pon a prueba tu claridad, entonación y fluidez.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill })}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-3 font-label font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken hover:shadow-2xs active:scale-[0.98]"
        >
          <MessageCircle size={16} aria-hidden />
          Conversa
        </button>
        <button
          type="button"
          onClick={() => openCoach({ tab: 'missions', prefill })}
          title="Un reto corto con micrófono: el coach te da un objetivo y te escucha."
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border-default bg-surface-base px-3 font-label font-semibold text-fg transition-all duration-150 hover:bg-surface-sunken hover:shadow-2xs active:scale-[0.98]"
        >
          <Mic size={16} aria-hidden />
          Misión oral
        </button>
      </div>
    </div>
  )
}
