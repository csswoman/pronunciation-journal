// components/ai-coach/missions/scripted/LineResult.tsx
'use client'

// Planned structure:
// <LineResult>  — the attempt feedback block with new header, chips, phoneme fix, listen panel, retry CTA
//   <HeaderRow>
//     <KickerAndTitle> (TU PRONUNCIACIÓN + X de Y palabras bien)
//     <LegendDots> (● Bien, ● Casi, ● No se oyó)
//     <ScoreVerdict />
//   </HeaderRow>
//   <SpokenLineFeedback />
//   <PhonemeFix />
//   <ListenPanel />
//   <RetryAndContinue />

import { SpokenLineFeedback } from '@/components/pronunciation-feedback/SpokenLineFeedback'
import { PhonemeFix } from '@/components/pronunciation-feedback/PhonemeFix'
import { ListenPanel } from '@/components/pronunciation-feedback/ListenPanel'
import { ScoreVerdict } from './ScoreVerdict'
import { RetryAndContinue } from './RetryAndContinue'
import type { WordResult } from '@/lib/types'
import type { SyllableResult } from '@/lib/pronunciation/syllable-scoring'
import type { PhonemeInWordExplanation } from '@/lib/pronunciation/phoneme-in-word'
import type { SyllableRemediation } from '@/lib/pronunciation/syllable-remediation'

export interface LineResultFix {
  explanation: PhonemeInWordExplanation
  /** IPA with slashes for the audio button. */
  phonemeIpa: string
  status: 'incorrect' | 'missing'
}

interface Props {
  score: number
  wordResults: WordResult[]
  syllableMap: Map<string, SyllableResult[]>
  fix: LineResultFix | null
  remediation: SyllableRemediation | null
  targetText: string
  userAudioUrl: string | null | undefined
  onRetry: () => void
  onContinue: () => void
}

function feedbackHeadline(score: number): string {
  if (score >= 90) return 'Muy bien'
  if (score >= 70) return 'Casi: fíjate en lo marcado'
  return 'Repite fijándote en lo marcado'
}

export function LineResult({
  score,
  wordResults,
  syllableMap,
  fix,
  remediation,
  targetText,
  userAudioUrl,
  onRetry,
  onContinue,
}: Props) {
  const correctCount = wordResults.filter((w) => w.status === 'correct').length
  const totalCount = wordResults.length

  return (
    <div className="flex w-full flex-col gap-5 rounded-3xl border border-border-subtle bg-surface-raised p-5 sm:p-6 shadow-sm">
      {/* Header: kicker + title on the left, legend on the right */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <p className="m-0 text-[11px] font-bold uppercase tracking-wider text-fg-subtle">
            Tu pronunciación
          </p>
          <h3 className="m-0 font-display text-2xl sm:text-3xl font-bold text-fg text-balance">
            {correctCount} de {totalCount} palabras bien
          </h3>
        </div>

        {/* Legend dots */}
        <div className="flex items-center gap-3 text-xs font-medium text-fg-muted pt-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--success)]" />
            Bien
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--warning)]" />
            Casi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[var(--error)]" />
            No se oyó
          </span>
        </div>
      </div>

      {/* Score verdict */}
      <ScoreVerdict score={score} headline={feedbackHeadline(score)} />

      {/* Word chips row */}
      <SpokenLineFeedback wordResults={wordResults} syllableMap={syllableMap} />

      {/* Phoneme remediation card if present */}
      {fix && (
        <PhonemeFix
          explanation={fix.explanation}
          remediation={remediation}
          phonemeIpa={fix.phonemeIpa}
          score={score}
          status={fix.status}
          userAudioUrl={userAudioUrl}
        />
      )}

      {/* Listen panel */}
      <div className="w-full">
        <ListenPanel
          minimalPairs={remediation?.minimalPairs ?? []}
          targetText={targetText}
          userAudioUrl={userAudioUrl}
        />
      </div>

      {/* Retry and continue action bar */}
      <RetryAndContinue onRetry={onRetry} onContinue={onContinue} />
    </div>
  )
}

