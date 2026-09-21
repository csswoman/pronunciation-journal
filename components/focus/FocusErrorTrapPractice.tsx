'use client'

// Planned structure:
// <FocusErrorTrapPractice>
//   <SentenceChallenge />
//   <AnswerFeedback /> | <FinalScore />
// </FocusErrorTrapPractice>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import type { ErrorTrapBody } from '@/lib/focus/types'
import type { FocusPracticeAction } from '@/lib/focus/practice-progress'

export function FocusErrorTrapPractice({ body, onProgress }: { body: ErrorTrapBody; onProgress: (action: FocusPracticeAction) => void }) {
  const [index, setIndex] = useState(0)
  const [guess, setGuess] = useState<boolean | null>(null)
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(0)
  const startedRef = useRef(false)
  const sentences = body.sentences
  const item = sentences[index]
  const choose = (hasError: boolean) => {
    if (!startedRef.current) {
      startedRef.current = true
      onProgress({ kind: 'started' })
    }
    setGuess(hasError)
  }

  if (!item) return (
    <div className="rounded-3xl border border-border-default bg-surface-raised p-6" role="status">
      <h3 className="font-display text-h3 text-fg">Trampa terminada</h3>
      <p className="mt-2 text-body text-fg-muted">Detectaste {correct} de {sentences.length} oraciones correctamente.</p>
      {sentences.length > 0 && <p className="mt-2 font-semibold text-fg">Puntuación: {Math.round(correct / sentences.length * 100)} %</p>}
      <Button className="mt-5" variant="secondary" onClick={() => { setIndex(0); setGuess(null); setChecked(false); setCorrect(0) }}>Repetir trampa</Button>
    </div>
  )

  const isCorrect = guess === item.hasError
  return (
    <div className="rounded-3xl border border-border-default bg-surface-raised p-6">
      <p className="font-kicker text-fg-muted">Oración {index + 1} de {sentences.length}</p>
      <h3 className="mt-3 text-h3 font-semibold text-fg">{item.text}</h3>
      <fieldset className="mt-5" disabled={checked}>
        <legend className="mb-3 text-body-sm text-fg-muted">¿Esta oración tiene un error?</legend>
        <div className="flex flex-wrap gap-3">
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border-default px-4 text-body text-fg"><input type="radio" name={`trap-${index}`} checked={guess === true} onChange={() => choose(true)} /> Sí, tiene error</label>
          <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-border-default px-4 text-body text-fg"><input type="radio" name={`trap-${index}`} checked={guess === false} onChange={() => choose(false)} /> No, es correcta</label>
        </div>
      </fieldset>
      {checked && <div className="mt-5 rounded-xl border border-border-default bg-surface-sunken p-4" role="status">
        <p className="font-semibold text-fg">{isCorrect ? '¡Bien detectado!' : 'Revisa esta oración.'}</p>
        <p className="mt-2 text-body-sm text-fg-muted">{item.hasError ? `Forma correcta: ${item.correction || 'No se proporcionó una corrección.'}` : 'La oración original es correcta.'}</p>
        {item.explanation && <p className="mt-2 text-body-sm text-fg-muted">{item.explanation}</p>}
      </div>}
      <Button className="mt-5" disabled={guess === null} onClick={() => {
        if (!checked) { setChecked(true); onProgress({ kind: 'answered', exerciseId: `trap-${index}` }); if (isCorrect) setCorrect((value) => value + 1) }
        else { if (index === sentences.length - 1) onProgress({ kind: 'completed' }); setIndex((value) => value + 1); setGuess(null); setChecked(false) }
      }}>{checked ? 'Siguiente oración' : 'Comprobar'}</Button>
    </div>
  )
}
