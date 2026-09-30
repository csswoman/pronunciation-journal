'use client'

// Planned structure:
// <LearningFocusTopicsSheet>
//   <backdrop />
//   <dialog container>
//     <LearningFocusSheetHeader />
//     <dialog body: scrollable grouped topic list with LearningFocusTopicItem />
//     <quick test banner />
//     <dialog footer: cancel and dynamic save buttons />
//   </dialog container>
// </LearningFocusTopicsSheet>

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { AssessmentConcept } from '@/lib/courses/concept-profile'
import type { CefrLevelId } from '@/lib/courses/types'
import { useDialogFocus } from '@/hooks/useDialogFocus'
import type { FocusLevel } from '@/lib/learning-focus/types'
import { Lightbulb } from '@/components/icons'
import { LearningFocusSheetHeader } from './LearningFocusSheetHeader'
import { LearningFocusTopicItem } from './LearningFocusTopicItem'
import {
  collectLevelTopics,
  findConceptBySlug,
  GROUP_LABEL_OVERRIDES,
  type TopicItem,
} from './learningFocusSheetHelpers'

type LearningFocusTopicsSheetProps = {
  open: boolean
  level: FocusLevel
  claimedSlugs: Set<string>
  onClose: () => void
  onClaim: (concepts: AssessmentConcept[]) => Promise<void>
}

export default function LearningFocusTopicsSheet({
  open,
  level,
  claimedSlugs,
  onClose,
  onClaim,
}: LearningFocusTopicsSheetProps) {
  const { dialogRef } = useDialogFocus<HTMLDivElement>(open, onClose, '[aria-label="Cerrar"]')
  const [activeLevel, setActiveLevel] = useState<CefrLevelId>(level)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setActiveLevel(level)
    setSelected(new Set(claimedSlugs))
  }, [open, level, claimedSlugs])

  const topics = useMemo(() => collectLevelTopics(activeLevel), [activeLevel])

  const groupedTopics = useMemo(() => {
    const map = new Map<string, { label: string; items: TopicItem[] }>()
    for (const topic of topics) {
      const existing = map.get(topic.group)
      if (existing) {
        existing.items.push(topic)
      } else {
        const label = GROUP_LABEL_OVERRIDES[topic.group] ?? topic.group.toUpperCase()
        map.set(topic.group, { label, items: [topic] })
      }
    }
    return Array.from(map.values())
  }, [topics])

  const claimedInLevel = useMemo(
    () => topics.filter((t) => claimedSlugs.has(t.lessonSlug)),
    [topics, claimedSlugs],
  )
  const newSelectedInLevel = useMemo(
    () => topics.filter((t) => selected.has(t.lessonSlug) && !claimedSlugs.has(t.lessonSlug)),
    [topics, selected, claimedSlugs],
  )

  const totalTopics = topics.length || 1
  const claimedPercent = Math.min(100, Math.round((claimedInLevel.length / totalTopics) * 100))
  const newPercent = Math.min(
    100 - claimedPercent,
    Math.round((newSelectedInLevel.length / totalTopics) * 100),
  )

  const allNewSelected = useMemo(
    () => Array.from(selected).filter((slug) => !claimedSlugs.has(slug)),
    [selected, claimedSlugs],
  )

  const toggleLesson = useCallback(
    (slug: string) => {
      if (claimedSlugs.has(slug)) return
      setSelected((prev) => {
        const next = new Set(prev)
        if (next.has(slug)) next.delete(slug)
        else next.add(slug)
        return next
      })
    },
    [claimedSlugs],
  )

  const handleSave = useCallback(async () => {
    if (allNewSelected.length === 0) {
      onClose()
      return
    }
    const concepts = allNewSelected
      .map((slug) => findConceptBySlug(slug))
      .filter((c): c is AssessmentConcept => c !== null)

    setSaving(true)
    try {
      await onClaim(concepts)
      onClose()
    } finally {
      setSaving(false)
    }
  }, [allNewSelected, onClaim, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default bg-page-bg/60 backdrop-blur-md"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="focus-topics-title"
        tabIndex={-1}
        className="relative z-10 flex max-h-[min(92dvh,780px)] w-full flex-col rounded-t-3xl border border-border-subtle bg-card-bg shadow-2xl sm:mx-4 sm:max-w-xl sm:rounded-3xl md:max-w-2xl"
      >
        <LearningFocusSheetHeader
          activeLevel={activeLevel}
          onSelectLevel={setActiveLevel}
          claimedCount={claimedInLevel.length}
          totalCount={topics.length}
          newSelectedCount={newSelectedInLevel.length}
          claimedPercent={claimedPercent}
          newPercent={newPercent}
          onClose={onClose}
        />

        <div className="main-scrollbar min-h-0 flex-1 overflow-y-auto px-6 py-5 sm:px-7">
          {groupedTopics.length === 0 ? (
            <p className="py-4 text-center text-body text-fg-muted">
              No hay temas disponibles para este nivel.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {groupedTopics.map((group) => (
                <div key={group.label} className="flex flex-col gap-2.5">
                  <h3 className="font-mono text-caption font-bold tracking-wider text-fg-muted/70 uppercase">
                    {group.label}
                  </h3>
                  <div className="flex flex-col gap-1.5">
                    {group.items.map((lesson) => (
                      <LearningFocusTopicItem
                        key={lesson.lessonSlug}
                        slug={lesson.lessonSlug}
                        title={lesson.title}
                        keywords={lesson.keywords}
                        alreadyClaimed={claimedSlugs.has(lesson.lessonSlug)}
                        isSelected={selected.has(lesson.lessonSlug)}
                        onToggle={toggleLesson}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 pb-3 sm:px-7">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 sm:py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <Lightbulb size={18} className="shrink-0 text-amber-400" />
              <span className="text-body-sm text-fg-muted">
                Ponte a prueba con el test de inglés para calibrar tu nivel.
              </span>
            </div>
            <Link
              href="/assessment"
              onClick={onClose}
              className="shrink-0 text-body-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              Hacer test
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border-subtle px-6 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:px-7 sm:pb-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border-subtle bg-surface-raised py-3.5 px-5 text-body font-semibold text-fg transition-colors hover:bg-surface-sunken"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || allNewSelected.length === 0}
            className="flex-1 rounded-full bg-(--accent-pink) py-3.5 px-5 text-body font-semibold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving
              ? 'Guardando…'
              : allNewSelected.length > 0
                ? `Guardar ${allNewSelected.length} ${allNewSelected.length === 1 ? 'tema' : 'temas'}`
                : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
