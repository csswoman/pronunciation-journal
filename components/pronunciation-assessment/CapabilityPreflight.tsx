'use client'

// Planned structure:
// <CapabilityPreflight>
//   <PreflightPrivacyNotice />
//   <PreflightDegradedNotice />
//   <PreflightContinueButton />
// </CapabilityPreflight>

import { useEffect, useState } from 'react'

import Button from '@/components/ui/Button'
import {
  buildCapabilitySnapshot,
  canEvaluateProduction,
  requestMicPermission,
  subscribeToMicPermissionChanges,
} from '@/lib/pronunciation/assessment/capability'
import type { CapabilitySnapshot } from '@/lib/pronunciation/assessment/types'
import { PreflightDegradedNotice } from './PreflightDegradedNotice'
import { PreflightPrivacyNotice } from './PreflightPrivacyNotice'

interface CapabilityPreflightProps {
  onContinue: (snapshot: CapabilitySnapshot) => void
}

/**
 * Pre-recording checkpoint: privacy, capability detection, always a way forward.
 */
export function CapabilityPreflight({ onContinue }: CapabilityPreflightProps) {
  const [snapshot, setSnapshot] = useState<CapabilitySnapshot | null>(null)
  const [isRequestingMic, setIsRequestingMic] = useState(false)
  const [micCheckMessage, setMicCheckMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let unsubscribe = () => {}

    void (async () => {
      const result = await buildCapabilitySnapshot()
      if (cancelled) return
      setSnapshot(result)

      const cleanup = await subscribeToMicPermissionChanges(async (micPermission) => {
        const nextSnapshot = await buildCapabilitySnapshot(micPermission)
        if (cancelled) return
        setMicCheckMessage(null)
        setSnapshot(nextSnapshot)
      })
      if (cancelled) cleanup()
      else unsubscribe = cleanup
    })()

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const isChecking = snapshot === null
  const canEvaluate = snapshot !== null && canEvaluateProduction(snapshot)
  const canRequestMicrophone =
    typeof window !== 'undefined' &&
    window.isSecureContext !== false &&
    typeof navigator.mediaDevices?.getUserMedia === 'function'

  const checkMicrophone = async () => {
    if (isRequestingMic) return null

    setIsRequestingMic(true)
    const micPermission = await requestMicPermission()
    const nextSnapshot = await buildCapabilitySnapshot(micPermission)
    setSnapshot(nextSnapshot)
    setMicCheckMessage(
      micPermission === 'denied'
        ? 'El permiso sigue bloqueado en Chrome. Cámbialo a Permitir desde el icono junto a la dirección.'
        : null
    )
    setIsRequestingMic(false)
    return nextSnapshot
  }

  const handleContinue = () => {
    if (snapshot && !isRequestingMic) onContinue(snapshot)
  }

  const shouldOfferActivation =
    canRequestMicrophone &&
    (snapshot?.micPermission === 'prompt' || snapshot?.micPermission === 'unknown')

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <PreflightPrivacyNotice />

      {!isChecking && !canEvaluate && <PreflightDegradedNotice snapshot={snapshot} />}

      {snapshot?.micPermission === 'denied' && canRequestMicrophone ? (
        <Button
          onClick={checkMicrophone}
          disabled={isRequestingMic}
          isLoading={isRequestingMic}
          variant="secondary"
          fullWidth
          className="min-h-11"
        >
          Ya lo permití: comprobar
        </Button>
      ) : null}

      {micCheckMessage ? (
        <p role="status" className="text-pretty font-body-sm text-error">
          {micCheckMessage}
        </p>
      ) : null}

      <Button
        onClick={shouldOfferActivation ? checkMicrophone : handleContinue}
        disabled={isChecking || isRequestingMic}
        isLoading={isChecking || isRequestingMic}
        fullWidth
        className="min-h-11"
      >
        {shouldOfferActivation
          ? 'Activar micrófono'
          : canEvaluate
            ? 'Empezar las preguntas'
            : snapshot
          ? 'Continuar sin micrófono'
          : 'Comprobando micrófono'}
      </Button>
    </div>
  )
}
