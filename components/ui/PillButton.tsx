import React from 'react'
import { cn } from '@/lib/cn'

/**
 * Pill-shaped action button used throughout practice/session flows.
 *
 * Distinct from the standard `<Button>`: that one is `rounded-sm`/`rounded-md`
 * for forms and dialogs; `PillButton` is `rounded-full` for the lightweight,
 * in-session affordances (Practicar, Continuar, Escuchar, Ya la sé).
 *
 * Variants:
 *  - primary: filled CTA (advance the session)
 *  - outline: bordered, quiet secondary action
 *  - quiet:   text-only, lowest-emphasis action (e.g. archive / dismiss)
 */

type PillVariant = 'primary' | 'outline' | 'quiet'
type PillSize = 'sm' | 'md'
type IconPosition = 'left' | 'right'

interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant
  size?: PillSize
  icon?: React.ReactNode
  iconPosition?: IconPosition
  isLoading?: boolean
}

const variantStyles: Record<PillVariant, string> = {
  primary: cn(
    'bg-primary text-on-primary border-none font-medium',
    'hover:bg-primary-hover',
  ),
  outline: cn(
    'bg-transparent text-fg-muted border border-border-subtle',
    'hover:bg-surface-sunken',
  ),
  quiet: cn(
    'bg-transparent text-fg-subtle border-none',
    'hover:text-fg-muted',
  ),
}

const sizeStyles: Record<PillSize, string> = {
  sm: 'text-xs py-1.5 px-3 gap-1.5',
  md: 'text-xs py-2 px-5 gap-1.5',
}

export function PillButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...props
}: PillButtonProps) {
  const isDisabled = disabled || isLoading

  const iconNode = icon && (
    <span className={cn('shrink-0 inline-flex', isLoading && 'animate-spin')}>{icon}</span>
  )

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center rounded-full cursor-pointer font-[inherit]',
        'transition-colors duration-150 ease-out-quart focus-ring',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {iconPosition === 'left' && iconNode}
      {children}
      {iconPosition === 'right' && iconNode}
    </button>
  )
}
