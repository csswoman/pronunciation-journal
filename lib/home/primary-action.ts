/**
 * The single thing the learner should do on opening the app.
 *
 * Computed server-side and rendered immediately, because the cost of a busy
 * home is not visual clutter but the decision it forces at the exact moment
 * motivation is lowest. One destination, no menu.
 */

export interface PrimaryActionInput {
  /** Has the learner completed the placement test? */
  hasPlacement: boolean
  /** Has today's plan already been finished? */
  planDoneToday: boolean
  /** SRS items waiting (words + sounds). */
  dueCount: number
  /** Estimated minutes for today's session. */
  estimatedMinutes: number
}

export interface PrimaryAction {
  label: string
  sublabel?: string
  href: string
  /** `primary` is the big call to action; `secondary` is the calm post-session state. */
  variant: 'primary' | 'secondary'
}

export function resolvePrimaryAction(input: PrimaryActionInput): PrimaryAction {
  // A learner with no placement has no meaningful plan to run yet.
  if (!input.hasPlacement) {
    return {
      label: 'Empezar por tu nivel (5 min)',
      sublabel: 'Una prueba corta para ajustar todo lo demás',
      href: '/assessment',
      variant: 'primary',
    }
  }

  if (input.planDoneToday) {
    return {
      label: 'Práctica libre',
      sublabel: 'Ya completaste la sesión de hoy',
      href: '/practice',
      variant: 'secondary',
    }
  }

  return {
    label: `Empezar (${input.estimatedMinutes} min)`,
    sublabel: input.dueCount > 0 ? `${input.dueCount} en repaso` : undefined,
    href: '/daily',
    variant: 'primary',
  }
}
