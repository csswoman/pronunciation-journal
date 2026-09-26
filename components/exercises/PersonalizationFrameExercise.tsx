'use client'

// Planned structure:
// <PersonalizationFrameExercise>
//   <FrameHeader />
//   <FrameSentence>
//     <Prefix />
//     <SlotInput />
//     <Suffix />
//   </FrameSentence>
//   <IssuesAlert />
//   <ActionButtons />
//   <SelfAssessSection />
//   <PolishWithAI />
// </PersonalizationFrameExercise>

import { useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradePersonalization } from '@/lib/exercises/personalization'
import { STRUCTURE_CHECKS } from '@/lib/exercises/structure-checks'
import { isOnline, gradeProduction } from '@/lib/exercises/grade-production-client'
import { buildPersonalizationTaskPrompt } from '@/lib/ai-prompts'
import { SelfAssessPrompt } from './SelfAssessPrompt'
import type { PersonalizationExercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

type FrameExercise = Extract<PersonalizationExercise, { mode: 'frame' }>

interface Props {
  exercise: FrameExercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}

export function PersonalizationFrameExercise({ exercise, onResult }: Props) {
  const [value, setValue] = useState('')
  const [done, setDone] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showSelfAssess, setShowSelfAssess] = useState(false)
  const [issues, setIssues] = useState<string[]>([])
  const [hints, setHints] = useState<string[]>([])
  const [polishing, setPolishing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const startedAt = useRef(Date.now())

  const frameParts = exercise.frame.split('___')
  const prefix = frameParts[0] ?? ''
  const suffix = frameParts[1] ?? ''

  const submit = () => {
    if (!value.trim() || done || showSelfAssess) return
    const res = gradePersonalization(exercise, value)
    const timeMs = Date.now() - startedAt.current

    if (res.ok) {
      setDone(true)
      setIssues([])
      setHints(res.hints)
      const hasReq = Boolean(exercise.requires && exercise.requires.length > 0)
      onResult(true, res.assembledSentence ?? value.trim(), timeMs, {
        score: 100,
        resultStatus: hasReq ? 'answered' : 'unscored',
        feedback: {
          immediate: '¡Oración completada!',
          canRetry: false,
        },
      })
    } else {
      const nextFail = failedAttempts + 1
      setFailedAttempts(nextFail)
      setIssues(res.issues)
      setHints(res.hints)
      if (nextFail >= 2 && exercise.requires && exercise.requires.length > 0) {
        setShowSelfAssess(true)
      }
    }
  }

  const handlePolish = async () => {
    if (!isOnline() || polishing) return
    setPolishing(true)
    try {
      const firstReq = exercise.requires?.[0]
      const checker = firstReq ? STRUCTURE_CHECKS[firstReq] : undefined
      const targetItem = (checker?.labelEs ?? exercise.frame).slice(0, 100)
      const constraintCheck = (checker?.checkEn ?? 'Check grammar').slice(0, 400)
      const taskPrompt = buildPersonalizationTaskPrompt({
        promptText: exercise.frame,
        example: exercise.example,
      })

      const grade = await gradeProduction({
        targetItem,
        taskPrompt,
        production: exercise.frame.replace('___', value.trim()),
        modality: 'written',
        constraintCheck,
        level: exercise.level,
      })
      if (grade?.feedback) {
        setAiSuggestion(grade.feedback)
      }
    } catch {
      // AI polishing error is non-blocking
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Habla de ti
        </span>
        <h2 className="text-body-md font-semibold text-fg">Completa la oración</h2>
        {exercise.hintEs && (
          <p className="text-body-sm text-fg-muted">{exercise.hintEs}</p>
        )}
      </div>

      <div className="rounded-xl border border-border-default bg-surface-sunken/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-h3 font-medium text-fg sm:text-h2">
          <span>{prefix}</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            disabled={done || showSelfAssess}
            aria-label="Espacio a completar"
            placeholder={exercise.slot === 'number' ? 'ej. 25' : '…'}
            className="min-w-28 max-w-xs rounded-lg border border-border-default bg-surface-raised px-3 py-1.5 text-h3 text-fg focus-ring placeholder:text-fg-subtle sm:text-h2"
          />
          <span>{suffix}</span>
        </div>
      </div>

      {exercise.example && !done && (
        <p className="text-body-sm text-fg-muted">
          Ejemplo: <span className="italic text-fg">{exercise.example}</span>
        </p>
      )}

      {issues.length > 0 && !done && !showSelfAssess && (
        <div role="alert" className="flex flex-col gap-1 text-body-sm text-error">
          {issues.map((issue, idx) => (
            <p key={idx}>{issue}</p>
          ))}
        </div>
      )}

      {hints.length > 0 && !done && !showSelfAssess && (
        <div className="flex flex-col gap-1 text-body-sm text-fg-muted">
          {hints.map((hint, idx) => (
            <p key={idx}>💡 {hint}</p>
          ))}
        </div>
      )}

      {showSelfAssess && (
        <SelfAssessPrompt
          canonicalAnswer={exercise.frame.replace('___', value.trim())}
          userAnswer={value.trim()}
          promptTitle="¿Usaste la estructura solicitada?"
          onMistake={() => {
            setDone(true)
            setShowSelfAssess(false)
            onResult(false, value.trim(), Date.now() - startedAt.current, {
              score: 0,
              resultStatus: 'answered',
            })
          }}
          onSelfApprove={() => {
            setDone(true)
            setShowSelfAssess(false)
            onResult(true, value.trim(), Date.now() - startedAt.current, {
              score: 70,
              resultStatus: 'unscored',
            })
          }}
        />
      )}

      {!done && !showSelfAssess && (
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={submit}
          disabled={!value.trim()}
        >
          Comprobar
        </Button>
      )}

      {done && isOnline() && (
        <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-sunken/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-body-sm font-semibold text-fg">Sugerencias pedagógicas</span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handlePolish()}
              disabled={polishing}
            >
              {polishing ? 'Revisando con IA…' : 'Pulir con IA'}
            </Button>
          </div>
          {aiSuggestion && (
            <p className="text-body-sm text-fg-muted">{aiSuggestion}</p>
          )}
        </div>
      )}
    </div>
  )
}
