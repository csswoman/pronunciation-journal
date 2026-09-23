// Planned structure:
// <ReviewHubBanner>
//   <MomentumNotice count={totalReviewable} />
//   <AllClearNotice />
// </ReviewHubBanner>

import Link from 'next/link'
import { Sparkles } from '@/components/icons'
import { cn } from '@/lib/cn'

interface Props {
  showMomentum: boolean
  showAllClear: boolean
  totalReviewable: number
  elsewhereCount?: number
}

export function ReviewHubBanner({ showMomentum, showAllClear, totalReviewable, elsewhereCount = 0 }: Props) {
  if (!showMomentum && !showAllClear) return null

  return (
    <div className="page-dashboard__banner">
      {showMomentum ? (
        <div
          className={cn(
            'animate-message-in rounded-[var(--radius-lg)] border border-primary/20',
            'bg-primary-soft px-4 py-3',
          )}
        >
          <p className="m-0 font-body-sm text-fg">
            <span className="font-semibold tabular-nums text-primary">{totalReviewable}</span>
            {' '}
            {totalReviewable === 1 ? 'pendiente listo' : 'pendientes listos'} para repasar hoy
          </p>
          {elsewhereCount > 0 ? (
            <p className="m-0 mt-1 font-caption text-fg-muted">
              +{elsewhereCount} más en{' '}
              <Link href="/practice/essential-words" className="text-primary hover:underline">
                Palabras esenciales
              </Link>
              {' '}o{' '}
              <Link href="/practice/immersion" className="text-primary hover:underline">
                Inmersión
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {showAllClear ? (
        <div
          className={cn(
            'animate-fadeIn flex flex-col items-center gap-2 rounded-[var(--radius-lg)]',
            'border border-border-subtle bg-surface-sunken px-4 py-5 text-center',
          )}
        >
          <Sparkles size={20} className="text-primary" aria-hidden />
          <p className="m-0 font-body-sm font-medium text-fg">Estás al día</p>
          <p className="m-0 max-w-[36ch] font-caption text-fg-muted">
            Nada pendiente en el hub — sigue con tu plan diario o explora sonidos nuevos.
          </p>
        </div>
      ) : null}
    </div>
  )
}
