/**
 * When the daily plan offers a multi-turn oral mission.
 *
 * Previously missions were an optional candidate the selector could drop
 * entirely, so a learner whose core problem is freezing mid-conversation
 * could go weeks without ever holding one. A fixed cadence guarantees the
 * rehearsal without making every session long.
 */

/** Monday, Wednesday, Friday (JS getDay(): Sunday = 0). */
export const MISSION_DAYS_OF_WEEK: readonly number[] = [1, 3, 5]

export function shouldOfferMission(
  dayOfWeek: number,
  hasSpeechRecognition: boolean,
): boolean {
  if (!hasSpeechRecognition) return false
  return MISSION_DAYS_OF_WEEK.includes(dayOfWeek)
}
