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
import { Lightbulb } from '@/components/icons'
import Button from '@/components/ui/Button'
import { gradePersonalization } from '@/lib/exercises/personalization'
import { STRUCTURE_CHECKS } from '@/lib/exercises/structure-checks'
import { isOnline } from '@/lib/exercises/grade-production-client'
import { useProductionGrading } from '@/hooks/useProductionGrading'
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
  const polishPipeline = useProductionGrading({ exerciseKey: `${exercise.id}:polish` })
  const polishing = polishPipeline.grading
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
    setAiSuggestion(null)
    try {
      const firstReq = exercise.requires?.[0]
      const checker = firstReq ? STRUCTURE_CHECKS[firstReq] : undefined
      const targetItem = (checker?.labelEs ?? exercise.frame).slice(0, 100)
      const constraintCheck = (checker?.checkEn ?? 'Check grammar').slice(0, 400)
      const taskPrompt = buildPersonalizationTaskPrompt({
        promptText: exercise.frame,
        example: exercise.example,
      })

      const grade = await polishPipeline.grade({
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
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col items-start gap-5">
        <span className="rounded-full bg-primary px-5 py-2.5 font-mono text-body-sm font-bold uppercase tracking-widest text-on-accent">
          Habla de ti
        </span>
        <h2 className="font-display text-h3 font-bold leading-tight text-fg sm:text-h2">Completa la oración</h2>
        {exercise.hintEs && (
          <p className="mt-2 text-body-lg text-fg-muted">{exercise.hintEs}</p>
        )}
      </div>

      <div className="rounded-2xl border border-sky-deep/30 bg-sky p-6 text-center shadow-2xs sm:p-10">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-4 font-display text-2xl font-bold leading-relaxed text-ink sm:text-3xl">
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
            className="min-w-28 max-w-xs rounded-2xl border-2 border-ink bg-paper px-5 py-2 text-center font-display text-2xl font-bold text-ink focus-ring placeholder:text-fg-muted disabled:opacity-60 sm:text-3xl"
          />
          <span>{suffix}</span>
        </div>
      </div>

      {exercise.example && !done && (
        <p className="flex items-center gap-3 rounded-2xl bg-surface-sunken px-5 py-4 text-body-sm text-fg-muted">
          <Lightbulb size={16} aria-hidden className="shrink-0" />
          <span>
            Ejemplo: <span className="italic text-fg">{exercise.example}</span>
          </span>
        </p>
      )}

      {issues.length > 0 && !done && !showSelfAssess && (
        <div role="alert" className="flex flex-col gap-1 text-body-sm text-error font-medium">
          {issues.map((issue, idx) => (
            <p key={idx}>{issue}</p>
          ))}
        </div>
      )}

      {hints.length > 0 && !done && !showSelfAssess && (
        <div className="flex flex-col gap-1 text-body-sm text-fg-muted font-medium">
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
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="rounded-full font-bold"
            onClick={submit}
            disabled={!value.trim()}
          >
            <span>Comprobar</span>
            <span className="hidden rounded-md bg-ink/10 px-2 py-0.5 font-mono text-tiny font-bold sm:inline-flex" aria-hidden>
              Enter
            </span>
          </Button>
        </div>
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
          {(aiSuggestion || polishPipeline.error) && (
            <p role={polishPipeline.error ? 'alert' : undefined} className="text-body-sm text-fg-muted">{aiSuggestion ?? polishPipeline.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
