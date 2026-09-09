'use client'

import { PillButton } from '@/components/ui/PillButton'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { MissionFeedbackTarget } from './MissionFeedbackTarget'
import { MissionGoalSummary } from './MissionGoalSummary'

interface MissionResultProps {
  outcome: MissionOutcome
  onReviewCta: () => void
  onExit?: () => void
}

export default function MissionResult({ outcome, onReviewCta, onExit }: MissionResultProps) {
  return (
    <div className="space-y-3">
      <MissionGoalSummary goalAchieved={outcome.goalAchieved} />
      <MissionFeedbackTarget targetEvidence={outcome.targetEvidence} />
      <div className="flex flex-wrap gap-2 pt-1">
        {onExit && (
          <PillButton variant="outline" size="sm" className="min-h-11 flex-1" onClick={onExit}>
            Volver a misiones
          </PillButton>
        )}
        <PillButton variant="primary" size="sm" className="min-h-11 flex-1" onClick={onReviewCta}>
          Repasar después
        </PillButton>
      </div>
    </div>
  )
}
