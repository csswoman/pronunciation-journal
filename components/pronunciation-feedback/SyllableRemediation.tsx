'use client'

// Planned structure:
// <SyllableRemediation>
//   <PhonemeHeading />
//   <ArticulationSteps />
//   <SpanishTip />
//   <MinimalPairExamples />

import { speak } from '@/lib/phoneme-practice/tts'
import type { SyllableRemediation as RemediationData } from '@/lib/pronunciation/syllable-remediation'

interface Props {
  remediation: RemediationData
}

export function SyllableRemediation({ remediation }: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-raised p-3">
      <div className="flex items-baseline gap-2">
        <span className="text-body font-semibold text-fg">{remediation.ipa}</span>
        {remediation.visualCueEs && (
          <span className="text-body-sm text-fg-muted">{remediation.visualCueEs}</span>
        )}
      </div>

      {remediation.articulationEs.length > 0 && (
        <ul className="flex flex-col gap-1">
          {remediation.articulationEs.map((step, index) => (
            <li key={index} className="text-body-sm text-fg-muted">{step}</li>
          ))}
        </ul>
      )}

      {remediation.spanishTip && (
        <p className="text-body-sm text-fg">{remediation.spanishTip}</p>
      )}

      {remediation.minimalPairs.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-caption text-xs uppercase tracking-wider text-fg-muted">
            Escucha la diferencia
          </span>
          {remediation.minimalPairs.slice(0, 2).flatMap((pair) => [
            <button
              key={`${pair.wordA}-a`}
              type="button"
              onClick={() => speak(pair.wordA)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordA}
            </button>,
            <button
              key={`${pair.wordB}-b`}
              type="button"
              onClick={() => speak(pair.wordB)}
              className="rounded-md border border-border-default px-2 py-1 text-body-sm text-fg hover:bg-surface"
            >
              {pair.wordB}
            </button>,
          ])}
        </div>
      )}
    </div>
  )
}
