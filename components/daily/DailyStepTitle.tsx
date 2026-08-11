import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import { cn } from '@/lib/cn'

interface DailyStepTitleProps {
  title: string
  /** When set, rendered as a styled IPA badge instead of raw title text. */
  ipa?: string
  index: number
  /** Recessed pending rows — secondary ink so the active step leads. */
  muted?: boolean
  /** Entry/current step — index takes the theme accent. */
  emphasize?: boolean
}

/** Step index + title, with IPA styled when the step has a phoneme focus. */
export function DailyStepTitle({
  title,
  ipa,
  index,
  muted = false,
  emphasize = false,
}: DailyStepTitleProps) {
  const formatted = ipa ? formatIpaDisplay(ipa) : ''
  let plainTitle = title
  if (formatted) {
    if (plainTitle.includes(formatted)) {
      plainTitle = plainTitle.replace(formatted, '')
    } else if (ipa && plainTitle.includes(ipa)) {
      plainTitle = plainTitle.replace(ipa, '')
    }
    plainTitle = plainTitle.replace(/\s+/g, ' ').trim() || 'Sound'
  }

  return (
    <p className={cn('flex min-w-0 items-center gap-2.5 text-label', muted ? 'text-fg-muted' : 'text-fg')}>
      <span
        className={cn(
          'font-mono shrink-0 tabular-nums text-caption',
          muted && 'text-fg-subtle',
          !muted && emphasize && 'font-semibold text-primary',
          !muted && !emphasize && 'text-fg-muted',
        )}
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="flex min-w-0 items-baseline gap-2 truncate">
        <span className="truncate font-semibold">{plainTitle}</span>
        {formatted ? (
          <span
            className={cn(
              'font-ipa shrink-0 text-body-md',
              muted ? 'text-fg-muted' : 'text-primary',
            )}
          >
            {formatted}
          </span>
        ) : null}
      </span>
    </p>
  )
}
