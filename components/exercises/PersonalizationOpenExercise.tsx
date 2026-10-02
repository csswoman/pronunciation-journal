'use client'

// Planned structure:
// <PersonalizationOpenExercise>
//   <PromptHeader />
//   <RequiredStructureChips />
//   <OpenTextarea />
//   <WordCountProgress />
//   <IssuesAlert />
//   <SubmitButton />
//   <SelfAssessSection />
//   <PolishWithAI />
// </PersonalizationOpenExercise>

import { useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { gradePersonalization } from '@/lib/exercises/personalization'
import { checkStructures, STRUCTURE_CHECKS } from '@/lib/exercises/structure-checks'
import { isOnline } from '@/lib/exercises/grade-production-client'
import { useProductionGrading } from '@/hooks/useProductionGrading'
import { buildPersonalizationTaskPrompt } from '@/lib/ai-prompts'
import { SelfAssessPrompt } from './SelfAssessPrompt'
import type { PersonalizationExercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

type OpenExercise = Extract<PersonalizationExercise, { mode: 'open' }>

interface Props {
  exercise: OpenExercise
  onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void
}

export function PersonalizationOpenExercise({ exercise, onResult }: Props) {
  const [text, setText] = useState(exercise.starter ?? '')
  const [done, setDone] = useState(false)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [showSelfAssess, setShowSelfAssess] = useState(false)
  const [issues, setIssues] = useState<string[]>([])
  const [hints, setHints] = useState<string[]>([])
  const polishPipeline = useProductionGrading({ exerciseKey: `${exercise.id}:polish` })
  const polishing = polishPipeline.grading
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const startedAt = useRef(Date.now())

  const words = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text])
  const wordCount = words.length

  // Live checks for requested structures
  const structureStatuses = useMemo(() => {
    return exercise.requires.map((id) => {
      const checker = STRUCTURE_CHECKS[id]
      const met = checkStructures(text, [id]).ok
      return { id, label: checker?.labelEs ?? id, met }
    })
  }, [exercise.requires, text])

  const submit = () => {
    if (!text.trim() || done || showSelfAssess) return
    const res = gradePersonalization(exercise, text)
    const timeMs = Date.now() - startedAt.current

    if (res.ok) {
      setDone(true)
      setIssues([])
      setHints(res.hints)
      onResult(true, text.trim(), timeMs, {
        score: 100,
        resultStatus: 'answered',
        feedback: {
          immediate: '¡Excelente producción!',
          canRetry: false,
        },
      })
    } else {
      const nextFail = failedAttempts + 1
      setFailedAttempts(nextFail)
      setIssues(res.issues)
      setHints(res.hints)
      if (nextFail >= 2) {
        setShowSelfAssess(true)
      }
    }
  }

  const handlePolish = async () => {
    if (!isOnline() || polishing) return
    setAiSuggestion(null)
    try {
      const firstReq = exercise.requires[0]
      const checker = STRUCTURE_CHECKS[firstReq]
      const targetItem = (checker?.labelEs ?? exercise.promptEs).slice(0, 100)
      const constraintCheck = (checker?.checkEn ?? 'Check grammar').slice(0, 400)
      const taskPrompt = buildPersonalizationTaskPrompt({
        promptText: exercise.promptEs,
        example: exercise.example,
      })

      const grade = await polishPipeline.grade({
        targetItem,
        taskPrompt,
        production: text.trim(),
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
      <div className="flex flex-col gap-1.5">
        <span className="w-fit rounded-full bg-primary px-3.5 py-1.5 font-mono text-tiny font-bold uppercase tracking-wider text-on-accent">
          Habla de ti
        </span>
        <h2 className="font-display text-h3 font-bold text-fg sm:text-h2">{exercise.promptEs}</h2>
        {exercise.hintEs && (
          <p className="text-body-sm text-fg-muted">{exercise.hintEs}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-tiny font-semibold uppercase tracking-wider text-fg-muted">
          Estructuras requeridas:
        </span>
        {structureStatuses.map((st) => (
          <span
            key={st.id}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-tiny font-bold transition-colors ${
              st.met
                ? 'bg-mint text-ink font-bold border border-mint-deep/50 dark:bg-mint/30 dark:text-fg'
                : 'bg-surface-sunken border border-border-default text-fg-muted'
            }`}
          >
            {st.met ? '✓' : '○'} {st.label}
          </span>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          disabled={done || showSelfAssess}
          placeholder="Escribe la forma correcta…"
          className="w-full resize-none rounded-2xl border-2 border-primary bg-field px-5 py-4 text-body-lg text-fg focus-ring placeholder:text-fg-muted disabled:opacity-60 shadow-xs"
        />
        <div className="flex items-center justify-between text-tiny text-fg-subtle font-medium">
          <span>
            {wordCount} / {exercise.minWords}–{exercise.maxWords} palabras
          </span>
          {exercise.example && (
            <span>
              Ejemplo: <span className="italic font-normal">{exercise.example}</span>
            </span>
          )}
        </div>
      </div>

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
          canonicalAnswer={exercise.promptEs}
          userAnswer={text.trim()}
          promptTitle="¿Usaste la estructura solicitada?"
          onMistake={() => {
            setDone(true)
            setShowSelfAssess(false)
            onResult(false, text.trim(), Date.now() - startedAt.current, {
              score: 0,
              resultStatus: 'answered',
            })
          }}
          onSelfApprove={() => {
            setDone(true)
            setShowSelfAssess(false)
            onResult(true, text.trim(), Date.now() - startedAt.current, {
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
          className="rounded-full font-bold shadow-sm"
          onClick={submit}
          disabled={!text.trim()}
        >
          <span>Comprobar</span>
          <span className="hidden font-mono text-tiny font-bold bg-white/25 text-on-accent px-2 py-0.5 rounded-md sm:inline-flex" aria-hidden>
            Enter
          </span>
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
          {(aiSuggestion || polishPipeline.error) && (
            <p role={polishPipeline.error ? 'alert' : undefined} className="text-body-sm text-fg-muted">{aiSuggestion ?? polishPipeline.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
