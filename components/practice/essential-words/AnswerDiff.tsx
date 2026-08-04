'use client'

// Planned structure:
// <AnswerDiff>
//   <WrittenVsExpected />  — "escribiste X, era Y"
//   <Explanation />         — only rendered when word-explanations.ts has one
// </AnswerDiff>

import { explanationFor } from '@/lib/essential-words/word-explanations'

interface Props {
  written: string
  expected: string
  isTypo: boolean
  /** The target word, used to look up an optional grammar explanation —
   * distinct from `expected`, which may be a full sentence for dictation
   * modes while `word` is always the single target vocabulary word. */
  word: string
}

export function AnswerDiff({ written, expected, isTypo, word }: Props) {
  const explanation = explanationFor(word)
  const message = isTypo
    ? `Casi — escribiste "${written}", revisa la ortografía de "${expected}".`
    : `Escribiste "${written}", la respuesta era "${expected}".`

  return (
    <div className="flex w-full flex-col items-center gap-1 text-center">
      <p data-testid="answer-diff-message" className="m-0 text-body text-fg">
        {message}
      </p>
      {explanation && (
        <p data-testid="answer-diff-explanation" className="m-0 text-caption text-fg-muted">
          {explanation}
        </p>
      )}
    </div>
  )
}
