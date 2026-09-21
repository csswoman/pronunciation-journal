'use client'

// Planned structure:
// <FocusDialogueBody>
//   <DialogueContext />
//   <DialogueTurnBubble />   (xN)
//   <DialogueControls />
// </FocusDialogueBody>

import React, { useState } from 'react'
import { cn } from '@/lib/cn'
import Button from '@/components/ui/Button'
import { useAICoachStore } from '@/lib/stores/aiCoachStore'
import type { DialogueBody } from '@/lib/focus/types'

interface FocusDialogueBodyProps {
  body: DialogueBody
  isPracticing?: boolean
  onStartPractice?: () => void
}

const PAGE_SIZE = 4

/** Conversación en burbujas alternadas, hablante A a la izquierda y B a la derecha. */
export function FocusDialogueBody({ body, isPracticing = false, onStartPractice }: FocusDialogueBodyProps) {
  const [page, setPage] = useState(1)
  const [isExpanded, setIsExpanded] = useState(false)

  const openCoach = useAICoachStore((s) => s.openCoach)
  const totalPages = Math.ceil(body.turns.length / PAGE_SIZE)
  const visibleTurns = body.turns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handlePracticeWithCoach = () => {
    const formattedDialogue = body.turns
      .map((t) => `Persona ${t.speaker}: ${t.text}`)
      .join('\n')
    openCoach({
      tab: 'chat',
      prefill: `Hola Coach, me gustaría practicar el siguiente diálogo en voz alta. Tú eres la Persona A y yo la Persona B:\n\n${formattedDialogue}`,
    })
  }

  const handleOpenMissions = () => {
    openCoach({ tab: 'missions' })
  }

  const renderContent = () => (
    <div className="space-y-4">
      <p className="text-body-sm text-[var(--text-secondary)] italic">
        {body.context}
      </p>

      <div className="space-y-2">
        {visibleTurns.map((turn, index) => {
          const isSpeakerA = turn.speaker === 'A'
          return (
            <div
              key={index}
              className={cn('flex', isSpeakerA ? 'justify-start' : 'justify-end')}
            >
              <div
                className={cn(
                  'max-w-[80%] px-4 py-2.5 rounded-2xl text-body',
                  isSpeakerA
                    ? 'bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-primary)]'
                    : 'bg-[var(--primary-soft)] text-[var(--primary)]',
                )}
              >
                <span className="block text-tiny font-semibold opacity-70 mb-0.5">
                  {turn.speaker}
                </span>
                {turn.text}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Anteriores
          </Button>
          <span className="text-tiny text-[var(--text-secondary)] font-mono">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Siguientes
          </Button>
        </div>
      )}

      {!isPracticing && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[var(--border-subtle)]">
          {onStartPractice && (
            <Button onClick={onStartPractice}>
              Ir a preguntas
            </Button>
          )}
          <Button variant="secondary" onClick={handlePracticeWithCoach}>
            Practicar diálogo con el Coach
          </Button>
          <Button variant="secondary" onClick={handleOpenMissions}>
            Misiones orales
          </Button>
        </div>
      )}
    </div>
  )

  if (isPracticing) {
    return (
      <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-raised)] p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-body-sm font-semibold text-[var(--text-primary)]">
            Diálogo de referencia
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? 'Ocultar diálogo' : 'Consultar diálogo'}
          </Button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
            {renderContent()}
          </div>
        )}
      </div>
    )
  }

  return renderContent()
}
