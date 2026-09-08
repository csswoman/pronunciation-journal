'use client'

// Planned structure:
// <LineResult>  — the whole `attempt` block, three visual weights
//   <ScoreVerdict />
//   <SpokenLineFeedback />
//   <PhonemeFix />        (only when `fix` is set)
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
  return (
    <>
      <div className="flex w-full flex-col gap-2.5 rounded-lg rounded-tr-sm border border-border-subtle bg-surface-raised/95 px-4 py-3 shadow-xs">
        <ScoreVerdict score={score} headline={feedbackHeadline(score)} />
        <SpokenLineFeedback wordResults={wordResults} syllableMap={syllableMap} />
        {fix && (
          <PhonemeFix
            explanation={fix.explanation}
            remediation={remediation}
            phonemeIpa={fix.phonemeIpa}
            score={score}
            status={fix.status}
          />
        )}
      </div>

      <div className="w-full">
        <ListenPanel
          minimalPairs={remediation?.minimalPairs ?? []}
          targetText={targetText}
          userAudioUrl={userAudioUrl}
        />
      </div>

      <RetryAndContinue onRetry={onRetry} onContinue={onContinue} />
    </>
  )
}
