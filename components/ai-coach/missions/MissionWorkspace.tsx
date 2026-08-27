'use client'

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { speakPhrase } from '@/lib/ai-coach/pronunciation'
import { useSharedMicStream } from '@/hooks/useSharedMicStream'
import { useSpeechInput } from '@/hooks/useSpeechInput'
import { scorePronunciation } from '@/lib/pronunciation/scoring'
import type { AIMessage, ExerciseResult, VoiceMetadata } from '@/lib/ai-practice/types'
import { getMission } from '@/lib/ai-practice/missions/registry'
import { isConversationalMission, isScriptedMission } from '@/lib/ai-practice/missions/types'
import { getRunnerFor } from '@/lib/ai-practice/missions/runner-registry'
import { deriveMissionOutcome } from '@/lib/ai-practice/missions/outcome'
import { persistMissionSession } from '@/lib/ai-practice/missions/persistence'
import {
  createMissionState,
  missionReducer,
  type MissionState,
} from '@/lib/ai-practice/missions/state-machine'
import MissionRunner from './MissionRunner'
import MissionResult from './MissionResult'
import ChatView from '../ChatView'
import CustomPromptPanel from '../CustomPromptPanel'
import type { MissionLaunch } from '@/lib/ai-practice/missions/launch'

/**
 * El runner con guion se elige por `mode` a traves del registry, no con un
 * `if` aqui: anadir un modo nuevo sin runner es un error de compilacion.
 */
const ScriptedRunner = lazy(getRunnerFor('scripted').load)

interface MissionWorkspaceProps {
  missionId: string
  launch?: MissionLaunch | null
  setMissionIntentHandler: (handler: ((intentId: string) => void) | null) => void
  messages: AIMessage[]
  isStreaming: boolean
  isDisabled: boolean
  onSendMessage: (text: string, options?: { voice?: VoiceMetadata }) => Promise<void>
  onSaveWord: (word: string, context: string) => void
  onToolAnswer: (callId: string, result: ExerciseResult) => void
}

/** Owns mission reducer state so the streaming transport remains state-free. */
export function MissionWorkspace({
  missionId,
  launch = null,
  setMissionIntentHandler,
  messages,
  isStreaming,
  isDisabled,
  onSendMessage,
  onSaveWord,
  onToolAnswer,
}: MissionWorkspaceProps) {
  const { user } = useAuth()
  const rawMission = getMission(missionId)
  const scriptedMission = rawMission && isScriptedMission(rawMission) ? rawMission : null
  const mission = rawMission && isConversationalMission(rawMission) ? rawMission : null
  const [state, setState] = useState<MissionState | null>(() => (
    mission ? createMissionState(mission.id) : null
  ))

  const persistedSessionRef = useRef<string | null>(null)
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

  const correctionPhrase = mission?.targets.find((target) => (
    target.targetId === state?.pendingCorrection?.targetId
  ))?.phrase ?? mission?.targets[0]?.phrase ?? ''
  const dispatchSpokenTurn = useCallback(async (transcript: string) => {
    if (!mission || !user?.id || !correctionPhrase) return

    try {
      const scoring = await scorePronunciation(transcript, correctionPhrase)
      setState((current) => current
        ? missionReducer(current, {
          type: 'turn_spoken',
          attempt: {
            userId: user.id,
            targetText: correctionPhrase,
            transcript,
            evaluatorVersion: 'mission-stt-v1',
            scoreKind: 'stt_intelligibility',
            overallScore: scoring.accuracy,
            targetId: mission.targets.find((target) => target.phrase === correctionPhrase)?.targetId,
            durationMs: 0,
            outcome: 'scored',
          },
        }, mission)
        : current)
    } catch {
      setState((current) => current
        ? missionReducer(current, {
          type: 'turn_spoken',
          attempt: {
            userId: user.id,
            targetText: correctionPhrase,
            transcript,
            evaluatorVersion: 'mission-stt-v1',
            scoreKind: 'stt_intelligibility',
            overallScore: 0,
            targetId: mission.targets.find((target) => target.phrase === correctionPhrase)?.targetId,
            durationMs: 0,
            outcome: 'failed',
          },
        }, mission)
        : current)
    }
  }, [correctionPhrase, mission, user?.id])

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

  const outcome = useMemo(() => {
    if (!mission || !state || state.phase !== 'result') return null
    return deriveMissionOutcome(state, mission)
  }, [mission, state])

  useEffect(() => {
    if (!mission || !state || !outcome || !user?.id) return
    const sessionKey = `${mission.id}:${state.turnCount}:${state.status}`
    if (persistedSessionRef.current === sessionKey) return
    persistedSessionRef.current = sessionKey
    void persistMissionSession(user.id, mission, state, outcome, launch).catch(() => undefined)
  }, [launch, mission, outcome, state, user?.id])

  // El guion ocupa el panel entero: se practica hablando, sin caja de texto.
  // El dialogo recorrido se lee dentro del propio runner (`ScriptTranscript`).
  if (scriptedMission) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <Suspense fallback={null}>
          <ScriptedRunner mission={scriptedMission} />
        </Suspense>
      </div>
    )
  }

  if (!mission || !state) return null

  const isTransferRecording = speechState === 'listening'
  const handleTransfer = () => {
    if (isTransferRecording) {
      void stop()
      return
    }
    reset()
    void start()
  }
  const handleMissionSubmit = (text: string, options?: { voice?: VoiceMetadata }) => {
    if (options?.voice?.transcript) {
      void dispatchSpokenTurn(text)
    } else {
      setState((current) => current
        ? missionReducer(current, { type: 'turn_text' }, mission)
        : current)
    }
    void onSendMessage(text, options)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="region"
        aria-label="Conversación de la misión"
        tabIndex={0}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        <div className="p-3">
          {outcome
            ? <MissionResult outcome={outcome} onReviewCta={() => window.location.assign('/tracking/review')} />
            : <MissionRunner
                mission={mission}
                state={state}
                onListen={() => speakPhrase(correctionPhrase)}
                onSlow={() => speakPhrase(correctionPhrase, 0.55)}
                onRetry={() => setState((current) => current ? missionReducer(current, { type: 'retry_correction' }, mission) : current)}
                onTransfer={handleTransfer}
                isTransferRecording={isTransferRecording}
              />}
        </div>
        {!outcome && <ChatView
          messages={messages}
          isStreaming={isStreaming}
          onSaveWord={onSaveWord}
          onSuggestionClick={(text) => handleMissionSubmit(text)}
          onToolAnswer={onToolAnswer}
          onNext={() => handleMissionSubmit('next')}
        />}
      </div>
      {!outcome && (
        <div className="shrink-0 border-t border-border-subtle bg-surface-base px-3 pb-3 pt-1">
          <CustomPromptPanel
            onSubmit={handleMissionSubmit}
            isDisabled={isStreaming || isDisabled}
            placeholder="Responde a la misión…"
          />
        </div>
      )}
    </div>
  )
}
