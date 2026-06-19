'use client'

import { Volume2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { PillButton } from './PillButton'

/**
 * Audio playback affordance: a Volume2 trigger that plays a model pronunciation.
 *
 * Two shapes:
 *  - labeled (default): outline pill with the speaker icon + text ("Escuchar").
 *  - iconOnly: compact round icon button, for tight rows (e.g. beside a sentence).
 *
 * TTS availability is detected once; the button auto-disables where speech
 * synthesis is unavailable, so callers don't repeat that guard.
 */

const ttsAvailable = typeof window !== 'undefined' && 'speechSynthesis' in window

interface ListenButtonProps {
  onPlay: () => void
  /** Visible text. Omit (with iconOnly) for a compact icon-only control. */
  label?: string
  iconOnly?: boolean
  disabled?: boolean
  'aria-label'?: string
  className?: string
}

export function ListenButton({
  onPlay,
  label = 'Escuchar',
  iconOnly = false,
  disabled,
  'aria-label': ariaLabel,
  className,
}: ListenButtonProps) {
  const isDisabled = disabled ?? !ttsAvailable

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={onPlay}
        disabled={isDisabled}
        aria-label={ariaLabel ?? label}
        className={cn(
          'inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full',
          'border border-border-subtle bg-transparent text-fg-muted cursor-pointer',
          'transition-colors duration-150 ease-out-quart focus-ring',
          'hover:bg-surface-sunken disabled:opacity-40 disabled:cursor-not-allowed',
          className,
        )}
      >
        <Volume2 size={14} aria-hidden />
      </button>
    )
  }

  return (
    <PillButton
      variant="outline"
      size="sm"
      icon={<Volume2 size={14} aria-hidden />}
      onClick={onPlay}
      disabled={isDisabled}
      aria-label={ariaLabel}
      className={className}
    >
      {label}
    </PillButton>
  )
}
