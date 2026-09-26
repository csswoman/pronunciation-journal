'use client'

// Planned structure:
// <ReportWrongFeedbackButton>
//   [TriggerButton | FeedbackForm | ConfirmationMessage]
// </ReportWrongFeedbackButton>

import { useState, useId, type FormEvent } from 'react'
import { reportWrongFeedback } from '@/lib/ai-feedback/report'
import type { AIFeedbackFeature } from '@/lib/ai-feedback/types'
import type { ErrorPatternId } from '@/lib/exercises/error-patterns'
import { useAuthOptional } from '@/components/auth/AuthProvider'

interface Props {
  feature: AIFeedbackFeature
  input: unknown
  output: unknown
  errorPattern?: ErrorPatternId | null
  promptVersion?: string
  userId?: string
  onSubmitted?: () => void
}

export function ReportWrongFeedbackButton({
  feature,
  input,
  output,
  errorPattern,
  promptVersion = 'v1',
  userId: propUserId,
  onSubmitted,
}: Props) {
  const auth = useAuthOptional()
  const userId = propUserId?.trim() || auth?.user?.id
  const [isOpen, setIsOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const inputId = useId()
  const submitErrorId = useId()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!userId || userId.toLowerCase() === 'guest' || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await reportWrongFeedback({
        userId,
        feature,
        promptVersion,
        input,
        output,
        errorPattern,
        comment,
      })
      setSubmitted(true)
      setIsOpen(false)
      onSubmitted?.()
    } catch {
      setSubmitError('No se pudo guardar el reporte. Inténtalo otra vez.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    const confirmationText =
      feature === 'journal_correction'
        ? 'Gracias, lo revisaremos'
        : 'Gracias, no lo contaremos como error'
    return (
      <span className="text-caption font-medium text-fg-muted" role="status">
        {confirmationText}
      </span>
    )
  }

  if (!userId || userId.toLowerCase() === 'guest') {
    return (
      <span className="text-caption text-fg-subtle" role="note">
        {auth?.loading ? 'Comprobando tu sesión…' : 'Inicia sesión para reportar'}
      </span>
    )
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="focus-ring inline-flex cursor-pointer items-center text-caption font-medium text-fg-subtle underline underline-offset-2 transition-colors hover:text-fg"
      >
        ¿Corrección equivocada?
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-1 text-left">
      <label htmlFor={inputId} className="text-caption font-medium text-fg-muted">
        ¿Por qué crees que está mal? (opcional)
      </label>
      <input
        id={inputId}
        type="text"
        maxLength={300}
        aria-describedby={submitError ? submitErrorId : undefined}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ej: es una expresión válida..."
        className="focus-ring rounded-[var(--radius-sm)] border border-border-subtle bg-surface-base px-2.5 py-1 text-caption text-fg placeholder:text-fg-subtle"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring cursor-pointer rounded-[var(--radius-sm)] bg-surface-raised px-2.5 py-1 text-caption font-semibold text-fg shadow-xs hover:bg-surface-sunken disabled:opacity-50"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar reporte'}
        </button>
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="focus-ring cursor-pointer text-caption text-fg-subtle hover:text-fg"
        >
          Cancelar
        </button>
      </div>
      {submitError ? (
        <p id={submitErrorId} className="m-0 text-caption text-error" role="alert">
          {submitError}
        </p>
      ) : null}
    </form>
  )
}
