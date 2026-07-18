'use client'

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
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? children}
      className="pf-cta pf-cta--primary"
      data-cuelume-press="press"
      data-cuelume-release="release"
    >
      {children}
    </button>
  )
}
