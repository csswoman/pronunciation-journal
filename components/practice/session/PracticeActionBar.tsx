import type { ReactNode } from 'react'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'

interface PracticeActionBarProps {
  children: ReactNode
  className?: string
}

interface PracticeExerciseCardProps {
  children: ReactNode
  className?: string
  spacing?: 'default' | 'roomy'
}

/** Canonical raised exercise surface shared by every practice family. */
export function PracticeExerciseCard({
  children,
  className,
  spacing = 'default',
}: PracticeExerciseCardProps) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center rounded-lg border border-border-subtle bg-surface-raised layout-card-pad',
        spacing === 'default' ? 'gap-layout-stack-loose' : 'gap-space-6',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * Shared home for the action that advances an active practice session.
 * It stays within the card on larger screens and moves into the mobile thumb
 * zone without covering the final feedback content.
 */
export function PracticeActionBar({ children, className }: PracticeActionBarProps) {
  return (
    <div className={cn('practice-action-bar w-full', className)}>
      <div className="practice-action-bar__spacer" aria-hidden="true" />
      <div className="practice-action-bar__dock">
        <div className="practice-action-bar__content">{children}</div>
      </div>
    </div>
  )
}

interface PracticeContinueButtonProps {
  onClick: () => void
  disabled?: boolean
  isLoading?: boolean
  children?: ReactNode
  shortcutLabel?: string
  className?: string
}

export function PracticeContinueButton({
  onClick,
  disabled = false,
  isLoading = false,
  children = 'Continuar',
  shortcutLabel = 'Enter',
  className,
}: PracticeContinueButtonProps) {
  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      fullWidth
      className={className}
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
    >
      <span>{children}</span>
      {shortcutLabel ? (
        <span className="hidden font-mono text-caption opacity-70 sm:inline" aria-hidden="true">
          {shortcutLabel}
        </span>
      ) : null}
    </Button>
  )
}
