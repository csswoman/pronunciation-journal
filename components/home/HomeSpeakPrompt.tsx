'use client'

// Planned structure:
// <HomeSpeakPrompt> — heading + Conversa | Misión oral (both secondary weight)

import { MessageCircle, Mic } from '@/components/icons'
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
    <div className="flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-raised p-4">
      <div>
        <p className="font-label text-fg">Practica en voz alta</p>
        <p className="font-caption mt-0.5 text-pretty text-fg-muted">
          {hasWords
            ? 'Usa las palabras de hoy en una conversación real con el coach.'
            : 'Habla con el coach sobre lo que practicaste hoy.'}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill })}
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-default bg-transparent px-3 font-label text-fg transition-colors hover:bg-surface-sunken"
        >
          <MessageCircle size={16} aria-hidden />
          Conversa
        </button>
        <button
          type="button"
          onClick={() => openCoach({ tab: 'missions', prefill })}
          title="Un reto corto con micrófono: el coach te da un objetivo y te escucha."
          className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border-default bg-transparent px-3 font-label text-fg transition-colors hover:bg-surface-sunken"
        >
          <Mic size={16} aria-hidden />
          Misión oral
        </button>
      </div>
    </div>
  )
}
