'use client'

import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import { missionForTarget, parseMissionLaunch, type MissionLaunchSource } from '@/lib/ai-practice/missions/launch'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

export function PronunciationMissionLaunchButton({
  targetId,
  source,
  stepId,
  label = 'Practicar en una misión',
  className,
}: {
  targetId: PronunciationTargetId
  source: Exclude<MissionLaunchSource, 'coach'>
  stepId?: string
  label?: string
  className?: string
}) {
  const openCoach = useAICoachStore((state) => state.openCoach)
  const mission = missionForTarget(targetId)
  if (!mission) return null

  return (
    <button
      type="button"
      className={className}
      onClick={() => openCoach({
        tab: 'missions',
        mission: parseMissionLaunch({
          launchId: crypto.randomUUID(),
          missionId: mission.id,
          targetIds: [targetId],
          source,
          stepId,
        }),
      })}
    >
      {label}
    </button>
  )
}
