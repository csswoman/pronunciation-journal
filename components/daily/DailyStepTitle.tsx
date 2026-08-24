import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import { cn } from '@/lib/cn'

interface DailyStepTitleProps {
  title: string
  /** When set, rendered as a styled IPA badge instead of raw title text. */
  ipa?: string
  /** Recessed pending rows — secondary ink so the active step leads. */
  muted?: boolean
  /** Entry/current step — title takes the theme accent surface. */
  emphasize?: boolean
}

/** Step title, with IPA styled when the step has a phoneme focus. */
export function DailyStepTitle({
  title,
  ipa,
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
    <p
      className={cn(
        'flex min-w-0 items-center gap-2.5 text-label',
        muted ? 'text-fg-muted' : emphasize ? 'text-on-primary' : 'text-fg',
      )}
    >
      <span className="flex min-w-0 items-baseline gap-2 truncate">
        <span className="truncate font-semibold">{plainTitle}</span>
        {formatted ? (
          <span
            className={cn(
              'font-ipa shrink-0 text-body-md',
              muted ? 'text-fg-muted' : emphasize ? 'text-on-primary' : 'text-primary',
            )}
          >
            {formatted}
          </span>
        ) : null}
      </span>
    </p>
  )
}
