'use client'

import { PillButton } from '@/components/ui/PillButton'
import type { MissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { MissionFeedbackTarget } from './MissionFeedbackTarget'
import { MissionGoalSummary } from './MissionGoalSummary'

interface MissionResultProps {
  outcome: MissionOutcome
  onReviewCta: () => void
}

export default function MissionResult({ outcome, onReviewCta }: MissionResultProps) {
  return (
    <div className="space-y-3">
      <MissionGoalSummary goalAchieved={outcome.goalAchieved} />
      <MissionFeedbackTarget targetEvidence={outcome.targetEvidence} />
      <PillButton variant="outline" size="sm" className="min-h-11" onClick={onReviewCta}>
        Repasar después
      </PillButton>
    </div>
  )
}
