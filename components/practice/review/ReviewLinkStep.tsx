'use client'

// Planned structure:
// <ReviewLinkStep>
//   <LinkStepContent />
//   <LinkStepActions />
// </ReviewLinkStep>

import Link from 'next/link'
import Button from '@/components/ui/Button'
import type { DailyStep } from '@/lib/practice/types'

interface Props {
  step: DailyStep
  onContinue: () => void
  onExit: () => void
}

export function ReviewLinkStep({ step, onContinue, onExit }: Props) {
  if (!step.href) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface-base p-4">
      <section className="flex w-full max-w-xl flex-col gap-5 rounded-[var(--radius-lg)] border border-border-subtle bg-surface-raised p-6">
        <div className="flex flex-col gap-2">
          <p className="font-kicker text-primary">Pendiente en tu plan</p>
          <h2 className="text-h2 text-fg">{step.title}</h2>
          <p className="font-body-sm text-fg-muted">{step.subtitle}</p>
          <p className="font-caption text-fg-muted">
            Ábrela en otra pestaña para conservar este repaso y vuelve cuando termines.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={step.href}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-ring inline-flex min-h-10 flex-1 items-center justify-center rounded-[var(--radius-md)] bg-[var(--cta-bg)] px-4 font-body-sm font-semibold text-[var(--cta-fg)] transition-colors hover:bg-[var(--cta-bg-hover)]"
          >
            Abrir pendiente
          </Link>
          <Button type="button" variant="secondary" size="md" onClick={onContinue}>
            Continuar repaso
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={onExit}>
            Salir
          </Button>
        </div>
      </section>
    </div>
  )
}
