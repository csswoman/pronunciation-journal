'use client'

import type { OralMission } from '@/lib/ai-practice/missions/types'

interface MissionTransferPromptProps {
  mission: OralMission
}

export function MissionTransferPrompt({ mission }: MissionTransferPromptProps) {
  return (
    <section className="layout-card-pad space-y-2 rounded-md border border-border-subtle bg-surface-raised">
      <p className="m-0 font-kicker text-fg-subtle">PRUÉBALO EN UNA SITUACIÓN NUEVA</p>
      <p className="m-0 text-body-sm text-fg-muted">{mission.transferVariant.context}</p>
      <p className="m-0 text-body-md font-medium text-fg">{mission.transferVariant.opening}</p>
    </section>
  )
}
