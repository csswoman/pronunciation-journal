'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import {
  activateEssentialWordNow,
  masterEssentialWord,
  snoozeEssentialWord,
} from '@/lib/db'
import { effectiveStatus } from '@/lib/srs/status'
import { sourceLabelFromWordId } from '@/lib/srs/vault'
import type { SRSData } from '@/lib/types'

const SNOOZE_DAYS = [7, 30, 90, 180] as const

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
  const [loadingAction, setLoadingAction] = useState<RowAction | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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
        <p className="m-0 text-sm text-fg-muted">{statusLabel}</p>
        {errorMessage ? (
          <p className="m-0 text-sm text-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>

      {status === 'snoozed' && (
        <div className="flex flex-wrap gap-2">
          {SNOOZE_DAYS.map((days) => (
            <Button
              key={days}
              type="button"
              variant="ghost"
              size="sm"
              isLoading={loadingAction === 'snooze'}
              disabled={isBusy && loadingAction !== 'snooze'}
              onClick={() =>
                void runAction('snooze', () => snoozeEssentialWord(entry.word, days))
              }
            >
              {days}
            </Button>
          ))}
        </div>
      )}

      {status === 'snoozed' && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="soft"
            size="sm"
            isLoading={loadingAction === 'activate'}
            disabled={isBusy && loadingAction !== 'activate'}
            onClick={() =>
              void runAction('activate', () => activateEssentialWordNow(entry.word))
            }
          >
            Practicar ahora
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isLoading={loadingAction === 'master'}
            disabled={isBusy && loadingAction !== 'master'}
            onClick={() =>
              void runAction('master', () => masterEssentialWord(entry.word))
            }
          >
            Dominada
          </Button>
        </div>
      )}
    </div>
  )
}
