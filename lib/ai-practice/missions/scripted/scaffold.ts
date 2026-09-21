import type { ScriptedMission } from '../types'
import type { PronunciationTargetId } from '@/lib/pronunciation/targets/types'

/**
 * Keeps one contextual coach prompt and one learner response for a lower-
 * friction daily mission. Prefer the authored learner line for the requested
 * target; older scripts without line-level target metadata fall back to the
 * first learner turn, which still preserves a complete, speakable exchange.
 */
export function scaffoldScript(
  mission: ScriptedMission,
  targetIds: readonly PronunciationTargetId[],
) {
  const normalize = (value: string) => value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
  const targetPhrases = mission.targets
    .filter((target) => targetIds.includes(target.targetId))
    .map((target) => normalize(target.phrase))
  const targetedLine = mission.script.findIndex((line) => (
    line.speaker === 'learner' && (
      (line.targetId != null && targetIds.includes(line.targetId)) ||
      targetPhrases.some((phrase) => phrase.length > 0 && normalize(line.text).includes(phrase))
    )
  ))
  const firstLearnerLine = mission.script.findIndex((line) => line.speaker === 'learner')
  const learnerIndex = targetedLine >= 0 ? targetedLine : firstLearnerLine

  if (learnerIndex < 0) return mission.script

  const firstIndex = Math.max(0, learnerIndex - 1)
  return mission.script.slice(firstIndex, learnerIndex + 1)
}
