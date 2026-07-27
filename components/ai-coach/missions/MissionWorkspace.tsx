'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { speakPhrase } from '@/lib/ai-coach/pronunciation'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useSpeechInput } from '@/hooks/useSpeechInput'
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
  const { user } = useAuth()
  const mission = getMission(missionId)
  const [state, setState] = useState<MissionState | null>(() => (
    mission ? createMissionState(mission.id) : null
  ))
  const { getStream, release } = useSharedMicStream()
  const submitTransferAttempt = useCallback((transcript: string) => {
    if (!mission || !user?.id) return
    setState((current) => current?.phase === 'transfer'
      ? missionReducer(current, {
        type: 'transfer_attempted',
        attempt: {
          userId: user.id,
          targetText: mission.transferVariant.opening,
          transcript,
          evaluatorVersion: 'mission-transcript-v1',
          scoreKind: 'stt_intelligibility',
          overallScore: 0,
          durationMs: 0,
          outcome: 'unscored',
        },
      }, mission)
      : current)
  }, [mission, user?.id])
  const { state: speechState, start, stop, reset } = useSpeechInput({
    prefer: 'auto',
    getStream,
    onResult: (result) => submitTransferAttempt(result.transcript),
  })

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

    return () => {
      setMissionIntentHandler(null)
      release()
    }
  }, [mission, release, setMissionIntentHandler])

  if (!mission || !state) return null

  const correctionPhrase = mission.targets.find((target) => (
    target.targetId === state.pendingCorrection?.targetId
  ))?.phrase ?? mission.targets[0].phrase
  const isTransferRecording = speechState === 'listening'
  const handleTransfer = () => {
    if (isTransferRecording) {
      void stop()
      return
    }
    reset()
    void start()
  }

  return (
    <MissionRunner
      mission={mission}
      state={state}
      onListen={() => speakPhrase(correctionPhrase)}
      onSlow={() => speakPhrase(correctionPhrase, 0.55)}
      onRetry={() => setState((current) => current ? missionReducer(current, { type: 'retry_correction' }, mission) : current)}
      onTransfer={handleTransfer}
      isTransferRecording={isTransferRecording}
    />
  )
}
