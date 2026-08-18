'use client'

// Planned structure:
// <AnswerDiff>
//   <WrittenVsExpected />  — "escribiste X, era Y"
//   <Explanation />         — only rendered when word-explanations.ts has one
// </AnswerDiff>

import { explanationFor } from '@/lib/essential-words/word-explanations'
import { displayEnglishWord } from '@/lib/essential-words/word-display'
import type { DictationFeedback } from '@/lib/essential-words/dictation-feedback'
import { AlertCircle, Check, Ear, X } from '@/components/icons'

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
    const isTypo = props.isTypo
    const title = isTypo ? 'Revisa la ortografía' : 'No es esa palabra'
    const message = isTypo
      ? `Escribiste "${written}". Revisa la ortografía de "${expected}".`
      : `Escribiste "${written}". La respuesta era "${expected}".`
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex w-full max-w-[42ch] items-start gap-3 rounded-md border px-4 py-3 text-left ${
          isTypo ? 'border-warning/30 bg-warning-soft' : 'border-error/30 bg-error-soft'
        }`}
      >
        <AlertCircle
          size={20}
          aria-hidden
          className={`mt-0.5 shrink-0 ${isTypo ? 'text-warning' : 'text-error'}`}
        />
        <div className="min-w-0">
          <p className={`m-0 text-label font-semibold ${isTypo ? 'text-warning' : 'text-error'}`}>{title}</p>
          <p data-testid="answer-diff-message" className="m-0 mt-1 text-body text-fg">{message}</p>
        {explanation && (
            <p data-testid="answer-diff-explanation" className="m-0 mt-1 text-caption text-fg-muted">{explanation}</p>
        )}
        </div>
      </div>
    )
  }

  const { feedback } = props
  const differences = feedback.words.filter((item) => item.status !== 'match')
  const phonetic = differences.find((item) => item.category === 'phonetic_substitution')
  const guess = differences.find((item) => item.category === 'guess')

  return (
    <div className="flex w-full flex-col items-center gap-space-4 text-center">
      <div className="flex flex-col items-center gap-space-3">
        <p data-testid="answer-diff-message" className="m-0 max-w-[48ch] text-h3 text-fg" aria-label="Oración correcta">
        {feedback.words.map((item, index) => {
          const isDifference = item.status !== 'match'
          return (
            <span key={`${item.expected}-${index}`} className="mx-0.5 inline">
              {isDifference && item.written ? <span data-testid="answer-diff-written" className="inline-flex items-center gap-0.5 rounded-xs bg-error-soft px-1 py-0.5 text-error"><X size={14} aria-hidden />{item.written}</span> : null}
              {isDifference ? <span className="inline-flex items-center gap-0.5 rounded-xs bg-success-soft px-1 py-0.5 text-success"><Check size={14} aria-hidden />{item.expected}</span> : item.expected}
              {index < feedback.words.length - 1 ? ' ' : feedback.terminalPunctuation}
            </span>
          )
        })}
        </p>
      </div>

      {phonetic ? <div className="flex w-full items-start gap-space-3 border-t border-line-divider pt-space-4 text-left" aria-label="Contraste fonético"><Ear size={20} aria-hidden className="mt-0.5 shrink-0 text-fg-muted" /><div><p className="m-0 font-ipa text-label text-fg">{phonetic.written} {phonetic.writtenIpa} → {phonetic.expected} {phonetic.expectedIpa}</p><p className="m-0 mt-1 text-body-sm text-fg-muted">Escucha el sonido que cambia entre ambas palabras.</p></div></div> : null}
      {guess ? <div className="flex w-full items-start gap-space-3 border-t border-line-divider pt-space-4 text-left" aria-label="Escucha de nuevo la oración"><Ear size={20} aria-hidden className="mt-0.5 shrink-0 text-fg-muted" /><p className="m-0 text-body-sm text-fg-muted">No hay un contraste fonético atribuible. Vuelve a escuchar la oración completa.</p></div> : null}
    </div>
  )
}
