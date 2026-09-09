'use client'

import type { ConversationalMission } from '@/lib/ai-practice/missions/types'
import { PillButton } from '@/components/ui/PillButton'

interface MissionTransferPromptProps {
  mission: ConversationalMission
  isRecording: boolean
  onTransfer: () => void
}


export function MissionTransferPrompt({ mission, isRecording, onTransfer }: MissionTransferPromptProps) {
  return (
    <section className="layout-card-pad space-y-2 rounded-md border border-border-subtle bg-surface-raised">
      <p className="m-0 font-kicker text-fg-subtle">PRUÉBALO EN UNA SITUACIÓN NUEVA</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.transferVariant.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.transferVariant.opening}</p>
      {isRecording && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error-soft border border-error/25 text-error w-fit animate-message-in"
        >
          <span className="size-2 rounded-full bg-error animate-pulse" aria-hidden />
          <span className="text-caption font-medium">Grabando tu voz…</span>
        </div>
      )}
      <PillButton
        variant={isRecording ? 'outline' : 'primary'}
        size="md"
        className={`min-h-11 ${isRecording ? 'ring-2 ring-error/40 text-error border-error/30' : ''}`}
        onClick={onTransfer}
        aria-label={isRecording ? 'Detener y enviar respuesta de transferencia' : 'Grabar respuesta de transferencia'}
      >
        {isRecording ? 'Detener y enviar' : 'Grabar respuesta'}
      </PillButton>
    </section>
  )
}
