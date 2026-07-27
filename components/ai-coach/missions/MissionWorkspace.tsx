'use client'

import { useEffect, useState } from 'react'
import { getMission } from '@/lib/ai-practice/missions/registry'
import {
  createMissionState,
  missionReducer,
  type MissionState,
} from '@/lib/ai-practice/missions/state-machine'
import MissionRunner from './MissionRunner'

interface MissionWorkspaceProps {
  missionId: string
  setMissionIntentHandler: (handler: ((intentId: string) => void) | null) => void
}

/** Owns mission reducer state so the streaming transport remains state-free. */
export function MissionWorkspace({ missionId, setMissionIntentHandler }: MissionWorkspaceProps) {
  const mission = getMission(missionId)
  const [state, setState] = useState<MissionState | null>(() => (
    mission ? createMissionState(mission.id) : null
  ))

  useEffect(() => {
    if (!mission) {
      setState(null)
      setMissionIntentHandler(null)
      return
    }

    setState(createMissionState(mission.id))
    setMissionIntentHandler((intentId) => {
      setState((current) => current
        ? missionReducer(current, { type: 'intent_observed', intentId }, mission)
        : current)
    })

    return () => setMissionIntentHandler(null)
  }, [mission, setMissionIntentHandler])

  if (!mission || !state) return null

  return (
    <MissionRunner
      mission={mission}
      state={state}
      onListen={() => {}}
      onSlow={() => {}}
      onRetry={() => setState((current) => current ? missionReducer(current, { type: 'retry_correction' }, mission) : current)}
      onTransfer={() => {}}
    />
  )
}
