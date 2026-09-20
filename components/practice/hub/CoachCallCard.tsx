'use client'

// Planned structure:
// <CoachCallCard> — Coach de conversación in PastelCard tone="mint"
//   Header: HABLA kicker + "libre" badge
//   Title: Coach de conversación + subtitle
//   Actions: Conversa (tinta sólida) + Misión oral (contorno)
//   Illustration: speaking watermark, bottom-right

import PastelCard from '@/components/layout/PastelCard'
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
    <PastelCard
      tone="mint"
      data-testid="speak-with-coach"
      className="group relative flex flex-col justify-between gap-5 rounded-3xl p-5 overflow-hidden shadow-sm motion-reduce:shadow-none"
    >
      <div className="flex flex-col gap-3 z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink select-none">
            HABLA
          </span>
          <span className="inline-flex items-center rounded-full bg-ink/12 px-2.5 py-0.5 font-sans text-caption font-bold text-ink">
            libre
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-h3 font-extrabold text-ink leading-tight">
            Coach de conversación
          </h2>
          <p className="font-sans text-body-sm text-ink-secondary text-pretty">
            Habla en voz alta y recibe corrección al instante.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5 pt-2 z-10">
        <button
          type="button"
          onClick={() => openCoach({ tab: 'chat', prefill })}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 font-label text-body-sm font-semibold text-paper transition-all hover:bg-ink-secondary cursor-pointer select-none"
        >
          <MessageCircle size={15} aria-hidden />
          <span>Conversa</span>
        </button>
        <button
          type="button"
          onClick={() => openCoach({ tab: 'missions', prefill })}
          className="focus-ring inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-ink/40 bg-transparent px-4 py-2 font-label text-body-sm font-semibold text-ink transition-colors hover:bg-ink/10 cursor-pointer select-none"
        >
          <Mic size={15} aria-hidden />
          <span>Misión oral</span>
        </button>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-2 bottom-1 hidden text-ink/15 transition-colors duration-200 group-hover:text-ink/25 sm:block [&>svg]:h-24 [&>svg]:w-auto"
      >
        <Illustration />
      </div>
    </PastelCard>
  )
}
