'use client'

import Button from '@/components/ui/Button'

// Planned structure:
// <PhonemeConfirmButton /> — CTA primaria compartida (pf-cta)

interface Props {
  onClick: () => void
  disabled?: boolean
  children?: string
  'aria-label'?: string
}

export function PhonemeConfirmButton({
  onClick,
  disabled = false,
  children = 'Comprobar',
  'aria-label': ariaLabel,
}: Props) {
  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? children}
      data-cuelume-press="press"
      data-cuelume-release="release"
    >
      {children}
    </Button>
  )
}
