'use client'

// Planned structure:
// <AnswerDiff>
//   <WrittenVsExpected />  — "escribiste X, era Y"
//   <Explanation />         — only rendered when word-explanations.ts has one
// </AnswerDiff>

import { explanationFor } from '@/lib/essential-words/word-explanations'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import type { DictationFeedback } from '@/lib/essential-words/dictation-feedback'
import { Ear, GitCompareArrows } from '@/components/icons'

interface DictationProps {
  feedback: DictationFeedback
  /** The target word is only used for a relevant optional grammar explanation. */
  word: string
}

/** Compatibility shape for the word-level recall and cloze cards. */
interface WordProps {
  written: string
  expected: string
  isTypo: boolean
  word: string
}

export function AnswerDiff(props: DictationProps | WordProps) {
  if (!('feedback' in props)) {
    const explanation = explanationFor(props.word)
    const expected = displayEnglishWord(props.expected)
    const written = props.written
    const message = props.isTypo
      ? `Casi — escribiste "${written}", revisa la ortografía de "${expected}".`
      : `Escribiste "${written}", la respuesta era "${expected}".`
    return (
      <div className="flex w-full flex-col items-center gap-1 text-center">
        <p data-testid="answer-diff-message" className="m-0 text-body text-fg">{message}</p>
        {explanation && (
          <p data-testid="answer-diff-explanation" className="m-0 text-caption text-fg-muted">{explanation}</p>
        )}
      </div>
    )
  }

  const { feedback, word } = props
  const explanation = explanationFor(word)
  const differences = feedback.words.filter((item) => item.status !== 'match')
  const writtenAtDifferences = [
    ...differences.map((item) => item.written ?? '—'),
    ...feedback.extras,
  ]
  const hasTargetError = differences.some(
    (item) => item.isTarget && (item.status === 'error' || item.status === 'missing'),
  )
  const targetErrors = differences.filter(
    (item) => item.isTarget && (item.status === 'error' || item.status === 'missing'),
  )
  const typos = differences.filter((item) => item.status === 'typo')

  return (
    <div className="flex w-full flex-col items-center gap-space-4 text-center">
      <div className="flex flex-col items-center gap-space-2">
        <p data-testid="answer-diff-message" className="m-0 max-w-[48ch] text-h3 text-fg" aria-label="Oración correcta">
        {feedback.words.map((item, index) => {
          const statusClass = item.status === 'error' || item.status === 'missing'
            ? 'bg-error-soft text-error'
            : item.status === 'typo'
              ? 'bg-warning-soft text-warning'
              : ''
          return (
            <span key={`${item.expected}-${index}`} className={statusClass ? `mx-0.5 inline-block rounded-xs px-1 py-0.5 ${statusClass}` : undefined}>
              {item.expected}{index < feedback.words.length - 1 ? ' ' : feedback.terminalPunctuation}
            </span>
          )
        })}
        </p>
        {writtenAtDifferences.length > 0 && (
          <p data-testid="answer-diff-written" className="m-0 text-body-sm text-fg-muted">
            escribiste: {writtenAtDifferences.join(' · ')}
          </p>
        )}
      </div>

      {(targetErrors.length > 0 || typos.length > 0) && (
        <div className="flex w-full flex-col gap-space-4 border-t border-line-divider pt-space-4 text-left" aria-label="Detalles de corrección">
          {targetErrors.map((item, index) => (
            <div key={`${item.expected}-${index}`} className="flex items-start gap-space-3">
              <Ear size={20} aria-hidden className="mt-0.5 shrink-0 text-error" />
              <div className="min-w-0">
                <p className="m-0 text-label text-fg">
                  {item.written ? `Escuchaste ${item.written}, pero era ${item.expected}` : `Faltó ${item.expected}`}
                </p>
                {explanation && hasTargetError && (
                  <p data-testid="answer-diff-explanation" className="m-0 mt-1 text-body-sm text-fg-muted">
                    {explanation}
                  </p>
                )}
              </div>
            </div>
          ))}
          {typos.map((item, index) => (
            <div key={`${item.expected}-${index}`} className="flex items-start gap-space-3">
              <GitCompareArrows size={20} aria-hidden className="mt-0.5 shrink-0 text-warning" />
              <p className="m-0 text-body-sm text-fg-muted">
                {item.written} → {item.expected} · errata, no cuenta como error
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
