'use client'

// Planned structure:
// <LearningFocusTopicsSheet>
//   <header />
//   <topic checkbox list />
//   <footer actions />
// </LearningFocusTopicsSheet>

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { COURSE_PATH_CURRICULUM } from '@/lib/courses/curriculum'
import type { AssessmentConcept } from '@/lib/courses/concept-profile'
import type { CefrLevelId } from '@/lib/courses/types'
import { cn } from '@/lib/cn'
import type { FocusLevel } from '@/lib/learning-focus/types'

type LearningFocusTopicsSheetProps = {
  open: boolean
  level: FocusLevel
  claimedSlugs: Set<string>
  onClose: () => void
  onClaim: (concepts: AssessmentConcept[]) => Promise<void>
}

function collectLessons(level: FocusLevel): AssessmentConcept[] {
  const track = COURSE_PATH_CURRICULUM.levels.find((item) => item.id === level)
  if (!track) return []

  const concepts: AssessmentConcept[] = []
  for (const unit of track.units) {
    for (const lesson of unit.lessons) {
      if (!lesson.slug) continue
      concepts.push({
        lessonSlug: lesson.slug,
        level: level as CefrLevelId,
        title: lesson.title,
      })
    }
  }
  return concepts
}

export default function LearningFocusTopicsSheet({
  open,
  level,
  claimedSlugs,
  onClose,
  onClaim,
}: LearningFocusTopicsSheetProps) {
  const firstFocusRef = useRef<HTMLButtonElement>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  const lessons = useMemo(() => collectLessons(level), [level])

  useEffect(() => {
    if (!open) return
    setSelected(new Set(claimedSlugs))
    firstFocusRef.current?.focus()
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, claimedSlugs, onClose])

  const toggleLesson = useCallback((slug: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(slug)) next.delete(slug)
      else next.add(slug)
      return next
    })
  }, [])

  const handleSave = useCallback(async () => {
    const concepts = lessons.filter((lesson) => selected.has(lesson.lessonSlug))
    if (concepts.length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await onClaim(concepts)
      onClose()
    } finally {
      setSaving(false)
    }
  }, [lessons, onClaim, onClose, selected])

  if (!open) return null

  const levelLabel = level.toUpperCase()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="focus-topics-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-page-bg/60 backdrop-blur-md"
      />

      <div className="relative z-10 flex max-h-[min(85dvh,640px)] w-full flex-col rounded-t-2xl bg-card-bg sm:mx-4 sm:max-w-md sm:rounded-2xl sm:shadow-xl">
        <div className="flex flex-col gap-1.5 border-b border-border-subtle px-layout-card-pad pt-layout-card-pad pb-4">
          <h2 id="focus-topics-title" className="text-body-lg font-semibold tracking-tight text-fg">
            Temas que ya sé
          </h2>
          <p className="text-caption leading-relaxed text-fg-muted">
            Marca lo que ya dominas en {levelLabel}. Lo veremos en el repaso; dominar se gana
            practicando.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-layout-card-pad py-3">
          {lessons.length === 0 ? (
            <p className="text-body-sm text-fg-muted">No hay temas de teoría para este nivel.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {lessons.map((lesson) => {
                const checked = selected.has(lesson.lessonSlug)
                const alreadyClaimed = claimedSlugs.has(lesson.lessonSlug)
                return (
                  <li key={lesson.lessonSlug}>
                    <label
                      className={cn(
                        'focus-within:ring-primary flex cursor-pointer items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-surface-sunken',
                        alreadyClaimed && 'opacity-80',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleLesson(lesson.lessonSlug)}
                        className="mt-0.5 size-4 shrink-0 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-body-sm text-fg">{lesson.title}</span>
                        {alreadyClaimed ? (
                          <span className="mt-0.5 block text-tiny text-fg-muted">Ya marcado</span>
                        ) : null}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-border-subtle px-layout-card-pad pt-4 pb-[calc(var(--layout-card-pad)+env(safe-area-inset-bottom,0px))] sm:pb-layout-card-pad">
          <button
            ref={firstFocusRef}
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="focus-ring w-full rounded-md bg-cta-bg py-3 text-body-sm font-semibold text-cta-fg transition-opacity hover:opacity-85 disabled:opacity-60"
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring w-full rounded-md py-3 text-body-sm font-semibold text-fg-muted transition-colors hover:bg-surface-sunken hover:text-fg"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
