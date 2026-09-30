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
import { isOnline, gradeProduction } from '@/lib/exercises/grade-production-client'
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
  const [polishing, setPolishing] = useState(false)
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
    setPolishing(true)
    try {
      const firstReq = exercise.requires[0]
      const checker = STRUCTURE_CHECKS[firstReq]
      const targetItem = (checker?.labelEs ?? exercise.promptEs).slice(0, 100)
      const constraintCheck = (checker?.checkEn ?? 'Check grammar').slice(0, 400)
      const taskPrompt = buildPersonalizationTaskPrompt({
        promptText: exercise.promptEs,
        example: exercise.example,
      })

      const grade = await gradeProduction({
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
    } finally {
      setPolishing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col gap-1.5">
        <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-subtle">
          Habla de ti
        </span>
        <h2 className="text-body-lg font-semibold text-fg sm:text-h3">{exercise.promptEs}</h2>
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
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-tiny font-medium transition-colors ${
              st.met
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold'
                : 'bg-surface-sunken text-fg-muted'
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
          placeholder="Escribe aquí tu respuesta…"
          className="w-full resize-none rounded-xl border border-border-default bg-surface-sunken/60 px-4 py-3 text-body-lg text-fg focus-ring placeholder:text-fg-subtle disabled:opacity-60"
        />
        <div className="flex items-center justify-between text-tiny text-fg-subtle">
          <span>
            {wordCount} / {exercise.minWords}–{exercise.maxWords} palabras
          </span>
          {exercise.example && (
            <span>
              Ejemplo: <span className="italic">{exercise.example}</span>
            </span>
          )}
        </div>
      </div>

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
          onClick={submit}
          disabled={!text.trim()}
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
