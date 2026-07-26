'use client'
import { useRef, useState } from 'react'
import { PillButton } from '@/components/ui/PillButton'
import { gradeProduction } from '@/lib/exercises/grade-production-client'
import { pedagogicalFeedbackFromProductionGrade } from '@/lib/exercises/feedback'
import { isExactTranslation } from '@/lib/exercises/translation'
import type { TranslationEsEnExercise as Exercise } from '@/lib/exercises/types'
import type { GenericRenderExtras } from '@/lib/practice/exercise-renderer/generic-registry'

export function TranslationEsEnExercise({ exercise, onResult }: { exercise: Exercise; onResult: (correct: boolean, answer: string, timeMs: number, extras?: GenericRenderExtras) => void }) {
  const [answer, setAnswer] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const startedAt = useRef(Date.now())
  async function submit() { const text = answer.trim(); if (!text || loading) return; if (isExactTranslation(exercise, text)) return onResult(true, text, Date.now() - startedAt.current, { score: 100 }); if (!navigator.onLine) return setError(`Sin conexión. Referencia: ${exercise.referenceEn}`); setLoading(true); setError(null); try { const grade = await gradeProduction({ targetItem: exercise.referenceEn, taskPrompt: `Translate from Spanish to English: ${exercise.sourceEs}`, production: text, modality: 'written' }); onResult(grade.correct, text, Date.now() - startedAt.current, { score: grade.score, feedback: pedagogicalFeedbackFromProductionGrade(grade) }) } catch { setError('No se pudo corregir. Inténtalo de nuevo.') } finally { setLoading(false) } }
  return <div className="flex flex-col gap-4"><p className="text-body-lg text-fg">{exercise.sourceEs}</p><textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3} placeholder="Tradúcelo al inglés…" className="rounded border border-border-default bg-surface-raised p-3 text-fg" />{error ? <p role="alert" className="text-body-sm text-error">{error}</p> : null}<PillButton variant="primary" size="md" disabled={!answer.trim() || loading} onClick={() => void submit()}>{loading ? 'Corrigiendo…' : 'Comprobar'}</PillButton></div>
}
