'use client'

// Planned structure:
// <SrsVaultRow>
//   <WordMeta />
//   <SnoozeSelect />     — un solo control de intervalo
//   <PrimarySecondary /> — Practicar ahora + Dominada (con confirmación)
// </SrsVaultRow>

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { useAuth } from '@/components/auth/AuthProvider'
import {
  activateEssentialWordNow,
  masterEssentialWord,
  snoozeEssentialWord,
} from '@/lib/db'
import { effectiveStatus } from '@/lib/srs/status'
import { sourceLabelFromWordId } from '@/lib/srs/vault'
import type { SRSData } from '@/lib/types'

const SNOOZE_DAYS = [7, 30, 90, 180] as const
type SnoozeDays = (typeof SNOOZE_DAYS)[number]

type RowAction = 'snooze' | 'activate' | 'master'

type SrsVaultRowProps = {
  entry: SRSData
}

function formatReturnDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function SrsVaultRow({ entry }: SrsVaultRowProps) {
  const { user } = useAuth()
  const [loadingAction, setLoadingAction] = useState<RowAction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [snoozeDays, setSnoozeDays] = useState<SnoozeDays>(90)
  const [confirmMaster, setConfirmMaster] = useState(false)
  const status = effectiveStatus(entry)
  const sourceLabel = sourceLabelFromWordId(entry.wordId)
  const statusLabel =
    status === 'mastered'
      ? 'Dominada'
      : `Vuelve el ${formatReturnDate(entry.nextReview)}`

  const runAction = async (action: RowAction, fn: () => Promise<void>) => {
    setLoadingAction(action)
    setErrorMessage(null)
    try {
      await fn()
      setConfirmMaster(false)
    } catch {
      setErrorMessage('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setLoadingAction(null)
    }
  }

  const isBusy = loadingAction !== null

  return (
    <div className="flex flex-col gap-3 border-b border-border-subtle py-4 last:border-b-0">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-base font-semibold text-fg">{entry.word}</span>
          <span className="font-caption text-fg-muted">{sourceLabel}</span>
        </div>
        <p className="m-0 text-body-sm text-fg-muted">{statusLabel}</p>
        {errorMessage ? (
          <p className="m-0 text-body-sm text-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {status === 'snoozed' && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-tiny font-medium text-fg-subtle">Pausar por</span>
            <select
              value={snoozeDays}
              disabled={isBusy}
              onChange={(event) => {
                const days = Number(event.target.value) as SnoozeDays
                setSnoozeDays(days)
                void runAction('snooze', () => snoozeEssentialWord(entry.word, days, user?.id))
              }}
              className="rounded-lg border border-border-default bg-surface-sunken px-3 py-2 text-body-sm text-fg focus-ring disabled:opacity-50"
            >
              {SNOOZE_DAYS.map((days) => (
                <option key={days} value={days}>
                  {days} días
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="soft"
              size="sm"
              isLoading={loadingAction === 'activate'}
              disabled={isBusy && loadingAction !== 'activate'}
              onClick={() =>
                void runAction('activate', () => activateEssentialWordNow(entry.word, user?.id))
              }
            >
              Practicar ahora
            </Button>

            {confirmMaster ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-body-sm text-fg-muted">¿Marcar como dominada?</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  isLoading={loadingAction === 'master'}
                  disabled={isBusy && loadingAction !== 'master'}
                  onClick={() =>
                    void runAction('master', () => masterEssentialWord(entry.word, user?.id))
                  }
                >
                  Sí, dominada
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={isBusy}
                  onClick={() => setConfirmMaster(false)}
                >
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isBusy}
                onClick={() => setConfirmMaster(true)}
              >
                Dominada
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
