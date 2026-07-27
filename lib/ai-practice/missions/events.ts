import { getMission } from './registry'

export type MissionStructuredEvent =
  | { type: 'start_mission'; missionId: string }
  | { type: 'intent_observed'; intentId: string }

export type MissionEventParseError =
  | 'unknown_event'
  | 'invalid_args'
  | 'unknown_mission'

export type MissionEventParseResult =
  | { ok: true; event: MissionStructuredEvent }
  | { ok: false; error: MissionEventParseError }

/** Parses only the structured events owned by the mission contract. */
export function parseMissionStructuredEvent(name: string, raw: unknown): MissionEventParseResult {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'invalid_args' }
  const args = raw as Record<string, unknown>

  if (name === 'start_mission') {
    if (typeof args.missionId !== 'string' || !args.missionId.trim()) {
      return { ok: false, error: 'invalid_args' }
    }
    if (!getMission(args.missionId)) return { ok: false, error: 'unknown_mission' }
    return { ok: true, event: { type: 'start_mission', missionId: args.missionId } }
  }

  if (name === 'mission_intent_observed') {
    if (typeof args.intentId !== 'string' || !args.intentId.trim()) {
      return { ok: false, error: 'invalid_args' }
    }
    return { ok: true, event: { type: 'intent_observed', intentId: args.intentId } }
  }

  return { ok: false, error: 'unknown_event' }
}
