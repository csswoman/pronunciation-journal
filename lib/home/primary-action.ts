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
  /** Ready for the level checkpoint (see `lib/home/checkpoint-readiness.ts`). */
  checkpointReady?: boolean
  /** `/assessment?mode=checkpoint&level={level}` — required when checkpointReady is true. */
  checkpointHref?: string
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
    if (input.checkpointReady && input.checkpointHref) {
      return {
        label: 'Hacer el checkpoint',
        sublabel: 'Ya completaste la sesión de hoy',
        href: input.checkpointHref,
        variant: 'secondary',
      }
    }
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
