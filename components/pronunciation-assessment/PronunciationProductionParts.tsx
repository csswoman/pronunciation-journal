'use client'

// Planned structure:
// <RecordingWaveform />
// <HeardConfirmation />
// <ProductionPromptCopy />

import type { RefObject } from 'react'
import Button from '@/components/ui/Button'

const WAVE_HEIGHTS = [36, 58, 72, 48, 84, 62, 40, 70, 52, 78, 44, 66]

export function RecordingWaveform() {
  return (
    <div
      className="flex h-8 w-full max-w-[12rem] items-center justify-center gap-0.5"
      aria-hidden
    >
      <style>{`
        @keyframes diag-wave-pulse {
          0%, 100% { transform: scaleY(0.35); opacity: 0.35; }
          50% { transform: scaleY(1); opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes diag-wave-pulse {
            0%, 100% { transform: none; opacity: 0.5; }
          }
        }
      `}</style>
      {WAVE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="inline-block w-0.5 origin-center rounded-full bg-primary"
          style={{
            height: `${height}%`,
            animation: 'diag-wave-pulse 1.4s ease-in-out infinite',
            animationDelay: `${index * 0.05}s`,
          }}
        />
      ))}
    </div>
  )
}

export function ProductionPromptCopy({
  headingRef,
  targetText,
  title,
  ipaHint,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>
  targetText: string
  title: string
  ipaHint: string | null | undefined
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 text-center">
      <p className="font-kicker text-fg-muted">Di en voz alta</p>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="min-w-0 text-pretty break-words text-h4 text-fg outline-none"
      >
        {targetText}
      </h2>
      <p className="text-pretty font-body-sm text-fg-muted">
        Enfoque: {title}
        {ipaHint ? (
          <>
            {' '}
            <span className="font-ipa" aria-label={title}>
              ({ipaHint})
            </span>
          </>
        ) : null}
      </p>
    </div>
  )
}

export function HeardConfirmation({
  heardText,
  confirmed,
  onConfirm,
  onRetry,
}: {
  heardText: string
  confirmed: boolean
  onConfirm: () => void
  onRetry: () => void
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex w-full max-w-md flex-col items-center gap-3 rounded-md bg-surface-sunken px-4 py-3 text-center"
    >
      <p className="font-kicker text-fg-muted">Te escuché</p>
      <p className="min-w-0 text-pretty break-words text-h4 text-fg">
        {heardText.length > 0 ? `“${heardText}”` : 'No capturé palabras claras'}
      </p>
      <p className="text-pretty font-body-sm text-fg-muted">
        {heardText.length > 0
          ? 'Si se oye bien, continúa. Si no, graba de nuevo.'
          : 'No pasó nada: puedes continuar o grabar de nuevo.'}
      </p>
      <div className="flex w-full flex-col gap-2 sm:max-w-xs">
        <Button
          type="button"
          fullWidth
          className="min-h-11"
          onClick={onConfirm}
          disabled={confirmed}
        >
          Continuar
        </Button>
        <Button type="button" variant="ghost" fullWidth className="min-h-11" onClick={onRetry}>
          Grabar de nuevo
        </Button>
      </div>
    </div>
  )
}
