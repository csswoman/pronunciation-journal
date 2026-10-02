'use client'

import Button from '@/components/ui/Button'

// Planned structure:
// <PhonemeConfirmButton /> — CTA primaria compartida (pf-cta)

interface Props {
  onClick: () => void
  disabled?: boolean
  children?: string
  'aria-label'?: string
  fullWidth?: boolean
}

export function PhonemeConfirmButton({
  onClick,
  disabled = false,
  children = 'Comprobar',
  'aria-label': ariaLabel,
  fullWidth = true,
}: Props) {
  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth={fullWidth}
      className="rounded-full font-bold shadow-sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? children}
      data-cuelume-press="press"
      data-cuelume-release="release"
    >
      <span>{children}</span>
      <span className="hidden font-mono text-tiny font-bold bg-white/25 text-on-accent px-2 py-0.5 rounded-md sm:inline-flex" aria-hidden>
        Enter
      </span>
    </Button>
  )
}
