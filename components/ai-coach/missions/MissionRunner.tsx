'use client'

import type { MissionState } from '@/lib/ai-practice/missions/state-machine'
import type { OralMission } from '@/lib/ai-practice/missions/types'
import { MissionBriefing } from './MissionBriefing'
import { MissionConversation } from './MissionConversation'
import { MissionTransferPrompt } from './MissionTransferPrompt'

// Planned structure:
// <MissionRunner>
//   <MissionBriefing />
//   <MissionConversation />
//   <MissionTransferPrompt />

interface MissionRunnerProps {
  mission: OralMission
  state: MissionState
  onListen: () => void
  onSlow: () => void
  onRetry: () => void
  onTransfer: () => void
}

export default function MissionRunner({ mission, state, onListen, onSlow, onRetry }: MissionRunnerProps) {
  return (
    <div className="space-y-3">
      {state.phase === 'briefing' && <MissionBriefing mission={mission} />}
      {(state.phase === 'active' || state.phase === 'correction') && (
        <MissionConversation
          pendingCorrection={state.pendingCorrection}
          onListen={onListen}
          onSlow={onSlow}
          onRetry={onRetry}
        />
      )}
      {state.phase === 'transfer' && <MissionTransferPrompt mission={mission} />}
    </div>
  )
}
