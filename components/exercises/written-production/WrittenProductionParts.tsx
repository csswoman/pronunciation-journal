// Planned structure:
// <HintToggle />      — round lightbulb button beside the title
// <TargetChip />      — "Incluye «word»" feedback chip
// <SubmitFooter>      — skip link + Enviar button with Enter badge
//   <SkipLink />
//   <SubmitButton />
// </SubmitFooter>

import { Check, Lightbulb } from '@/components/icons'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/cn'

export function HintToggle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      aria-label={open ? 'Ocultar ejemplo' : 'Ver un ejemplo'}
      className={cn(
        'flex size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border-none transition-colors focus-ring',
        open ? 'bg-butter text-ink' : 'bg-surface-sunken text-fg hover:bg-butter-soft hover:text-ink',
      )}
    >
      <Lightbulb size={20} aria-hidden />
    </button>
  )
}

export function TargetChip({ target, included }: { target: string; included: boolean }) {
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-body-sm font-semibold text-ink',
        included ? 'bg-mint' : 'bg-surface-sunken text-fg-muted',
      )}
    >
      {included && <Check size={16} aria-hidden />}
      {included ? `Incluye “${target}”` : `Usa “${target}”`}
    </span>
  )
}

export function SubmitFooter({
  grading,
  disabled,
  onSubmit,
  onSkip,
  submitLabel = 'Enviar',
}: {
  grading: boolean
  disabled: boolean
  onSubmit: () => void
  onSkip?: () => void
  submitLabel?: string
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          disabled={grading}
          aria-label="Omitir este ejercicio"
          className="min-h-11 cursor-pointer border-none bg-transparent px-1 text-body-md font-medium text-fg-muted underline underline-offset-4 transition-colors hover:text-fg focus-ring rounded-md disabled:cursor-not-allowed disabled:opacity-40"
        >
          Omitir este ejercicio
        </button>
      ) : (
        <span />
      )}
      <Button
        variant="primary"
        size="lg"
        className="rounded-full px-8 font-bold"
        onClick={onSubmit}
        disabled={disabled}
      >
        <span>{grading ? 'Corrigiendo…' : submitLabel}</span>
        {!grading && (
          <span
            className="hidden rounded-md bg-white/25 px-2 py-0.5 text-tiny font-bold text-on-accent sm:inline-flex"
            aria-hidden
          >
            Enter
          </span>
        )}
      </Button>
    </div>
  )
}
