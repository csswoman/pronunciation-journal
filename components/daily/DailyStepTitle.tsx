import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'

interface DailyStepTitleProps {
  title: string
  /** When set, rendered as a styled IPA badge instead of raw title text. */
  ipa?: string
  index: number
}

/** Step index + title, with IPA styled when the step has a phoneme focus. */
export function DailyStepTitle({ title, ipa, index }: DailyStepTitleProps) {
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
    <p className="flex min-w-0 items-center gap-2.5 text-label text-fg">
      <span className="font-caption shrink-0 tabular-nums text-fg-muted">
        {String(index + 1).padStart(2, '0')}
      </span>
      <span className="flex min-w-0 items-baseline gap-2 truncate">
        <span className="truncate font-semibold">{plainTitle}</span>
        {formatted ? (
          <span className="font-ipa shrink-0 text-body-md">{formatted}</span>
        ) : null}
      </span>
    </p>
  )
}
