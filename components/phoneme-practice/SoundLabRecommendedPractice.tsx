'use client'

// Planned structure:
// <SoundLabRecommendedPractice>
//   <PhraseSummary />
//   <SoundFocus />
//   <StartAction />
// </SoundLabRecommendedPractice>

import { ArrowRight } from '@/components/icons'
import Button from '@/components/ui/Button'
import { formatIpaDisplay } from '@/lib/lexicon/format-ipa'
import type { SoundLabPhraseRecommendation } from '@/lib/sound-lab/recommended-phrase'

interface Props {
  recommendation: SoundLabPhraseRecommendation
  onStart: () => void
}

export function SoundLabRecommendedPractice({ recommendation, onStart }: Props) {
  return (
    <section
      className="grid gap-layout-stack rounded-[var(--radius-lg)] border border-border-default bg-surface-raised layout-card-pad md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-layout-stack-loose"
      aria-labelledby="sound-lab-recommended-title"
    >
      <div className="min-w-0">
        <p className="font-kicker text-fg-subtle">Tu práctica recomendada</p>
        <h2
          id="sound-lab-recommended-title"
          className="mt-2 text-h3 text-fg"
          lang="en"
        >
          {recommendation.phrase}
        </h2>
        {recommendation.ipa ? (
          <p className="mt-1 font-ipa text-body-sm text-fg-muted" lang="en-fonipa">
            {formatIpaDisplay(recommendation.ipa)}
          </p>
        ) : null}
        <p className="mt-2 text-body-sm text-fg">{recommendation.meaning}</p>
        <p className="mt-1 max-w-[65ch] text-caption text-fg-muted">
          {recommendation.reason}
        </p>
      </div>

      <div className="flex min-w-0 flex-col items-start gap-3 md:items-end">
        <p className="text-caption text-fg-muted">
          Foco de sonido:{' '}
          <span className="font-ipa font-semibold text-fg">
            {recommendation.targetIpas.join(' · ')}
          </span>
        </p>
        <Button
          variant="primary"
          size="md"
          icon={<ArrowRight size={16} aria-hidden />}
          iconPosition="right"
          onClick={onStart}
        >
          Practicar esta frase
        </Button>
      </div>
    </section>
  )
}
