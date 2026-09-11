'use client'

// Planned structure:
// <FocusDialogueBody>
//   <DialogueContext />
//   <DialogueTurnBubble />   (xN)
// </FocusDialogueBody>

import React from 'react'
import { cn } from '@/lib/cn'
import type { DialogueBody } from '@/lib/focus/types'

interface FocusDialogueBodyProps {
  body: DialogueBody
}

/** Conversación en burbujas alternadas, hablante A a la izquierda y B a la derecha. */
export function FocusDialogueBody({ body }: FocusDialogueBodyProps) {
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-[var(--text-secondary)] italic">
        {body.context}
      </p>

      <div className="space-y-2">
        {body.turns.map((turn, index) => {
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
    </div>
  )
}
