'use client'

// Planned structure:
// <HomeSpeakPrompt> — heading + Conversa | Misión oral (text+arrow, not solid)

import { ArrowRight, MessageCircle, Mic } from '@/components/icons'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { buildCoachPrefill } from '@/lib/ai-practice/coach-prefill'
import type { SessionArc } from '@/lib/practice/types'

interface Props {
  arc: SessionArc | undefined
}

/** Own card beside the plan — coach is secondary to the plan entry CTA. */
export default function HomeSpeakPrompt({ arc }: Props) {
  const openCoach = useAICoachStore((s) => s.openCoach)
  const prefill = buildCoachPrefill(arc)
  const hasWords = (arc?.sessionWords?.length ?? 0) > 0

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div>
        <p className="font-label text-fg">Practica en voz alta</p>
        <p className="font-caption mt-0.5 text-pretty text-fg-muted">
          {hasWords
            ? 'Usa las palabras de hoy en una conversación real con el coach.'
            : 'Habla con el coach sobre lo que practicaste hoy.'}
        </p>
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          className="focus-ring group inline-flex min-h-10 items-center gap-2 rounded-sm font-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
          onClick={() => openCoach({ tab: 'chat', prefill })}
        >
          <MessageCircle size={16} aria-hidden />
          Conversa
          <ArrowRight
            size={16}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
        <button
          type="button"
          className="focus-ring group inline-flex min-h-10 items-center gap-2 rounded-sm font-body-sm font-medium text-fg-muted transition-colors hover:text-fg"
          title="Un reto corto con micrófono: el coach te da un objetivo y te escucha."
          onClick={() => openCoach({ tab: 'missions', prefill })}
        >
          <Mic size={16} aria-hidden />
          Misión oral
          <ArrowRight
            size={16}
            className="transition-transform duration-150 group-hover:translate-x-0.5"
            aria-hidden
          />
        </button>
      </div>
    </div>
  )
}
