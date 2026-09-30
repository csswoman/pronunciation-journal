'use client'

// Planned structure:
// <FreeformGapInput>
//   <LeftInputPanel (PastelCard mint)>
//     <KickerTitleSubtitle />
//     <QuickPromptChips />
//     <TextareaAndSubmitButton />
//   </LeftInputPanel>
//   <RightUnderstandingPanel (PastelCard butter)>
//     <InterpretationMessageBubble />
//     <MatchedOptionsList />
//     <KoboyoWatermarkIllustration />
//   </RightUnderstandingPanel>
// </FreeformGapInput>

import React, { useState } from 'react'
import PastelCard from '@/components/layout/PastelCard'
import { Check, Search } from '@/components/icons'
import { cn } from '@/lib/cn'
import { getIllustration } from '@/lib/illustrations/registry'
import { getTopicMetadata } from '@/lib/focus/topic-metadata'
import { TOPIC_CATALOG } from '@/lib/topic-catalog'
import type { SprintGap } from '@/lib/focus/types'

interface GapMatch {
  topicId: string
  confidence: number
  rationale: string
}

interface FreeformGapInputProps {
  selectedIds: string[]
  onSelect: (gap: SprintGap) => void
  selectionFull: boolean
}

const MAX_LENGTH = 300

function labelFor(topicId: string): string {
  return TOPIC_CATALOG.find((t) => t.id === topicId)?.label ?? topicId
}

const PROMPT_SUGGESTIONS = [
  'Diferenciar in, on, at',
  'Pronunciar el pasado con -ed',
  '"I did" vs "I have done"',
  'Hacer preguntas sin dudar',
]

const DEFAULT_MATCHES: GapMatch[] = [
  { topicId: 'grammar:past simple', confidence: 0.95, rationale: 'lo que ya pasó' },
  { topicId: 'grammar:present perfect', confidence: 0.88, rationale: 'lo que sigue contando' },
]

export function FreeformGapInput({ selectedIds, onSelect, selectionFull }: FreeformGapInputProps) {
  const [description, setDescription] = useState('')
  const [matches, setMatches] = useState<GapMatch[] | null>(DEFAULT_MATCHES)
  const [lastQuery, setLastQuery] = useState<string>(
    'cuando hablo de algo que ya pasó me trabo y no sé si decir I did o I have done',
  )
  const [isMatching, setIsMatching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Illustration = getIllustration('domainWriting')
  const canSubmit = description.trim().length >= 3 && !isMatching

  const performMatch = async (text: string) => {
    if (text.trim().length < 3 || isMatching) return
    setIsMatching(true)
    setError(null)
    setLastQuery(text.trim())

    try {
      const res = await fetch('/api/gemini/focus/match-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text.trim() }),
      })

      if (!res.ok) throw new Error('No pudimos interpretar tu descripción ahora mismo.')

      const data: { matches: GapMatch[] } = await res.json()
      setMatches(data.matches.length > 0 ? data.matches : DEFAULT_MATCHES)
    } catch {
      setMatches(DEFAULT_MATCHES)
    } finally {
      setIsMatching(false)
    }
  }

  const handleChipClick = (prompt: string) => {
    setDescription(prompt)
    performMatch(prompt)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
      {/* Left Input Panel (Mint) */}
      <PastelCard tone="mint" className="rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center rounded-full bg-ink px-3.5 py-1 text-tiny font-extrabold text-white w-fit uppercase tracking-wider">
            CON TUS PALABRAS
          </span>

          <div>
            <h3 className="font-display text-3xl font-extrabold text-ink tracking-tight">
              ¿Qué se te traba al hablar?
            </h3>
            <p className="mt-1 text-body-sm text-ink-secondary">
              Escríbelo en español, como te salga. Nosotros lo convertimos en un tema.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-tiny font-bold uppercase tracking-wider text-ink-muted">
              O EMPIEZA CON UNO DE ESTOS
            </span>
            <div className="flex flex-wrap gap-2">
              {PROMPT_SUGGESTIONS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleChipClick(prompt)}
                  disabled={isMatching}
                  className={cn(
                    'focus-ring rounded-full bg-white/80 border border-black/10 px-3.5 py-1.5 text-tiny font-semibold text-ink transition-all hover:bg-white hover:shadow-xs cursor-pointer',
                    description === prompt && 'bg-ink text-white border-transparent',
                  )}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <label htmlFor="freeform-gap-input" className="text-tiny font-bold uppercase tracking-wider text-ink-muted">
              Tu descripción
            </label>
            <textarea
              id="freeform-gap-input"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, MAX_LENGTH))}
              rows={4}
              placeholder="Ej: cuando hablo de algo que ya pasó me trabo y no sé si decir I did o I have done..."
              className="focus-ring w-full resize-none rounded-2xl border border-black/10 bg-white/90 p-4 text-body-sm text-ink placeholder:text-ink-muted shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-tiny text-ink-muted font-semibold">
            {description.length}/{MAX_LENGTH}
          </span>
          <button
            type="button"
            onClick={() => performMatch(description)}
            disabled={!canSubmit}
            className="focus-ring flex items-center gap-2 rounded-full bg-ink hover:opacity-90 text-white px-6 py-2.5 text-body-sm font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Search className="h-4 w-4 text-white" aria-hidden="true" />
            <span>{isMatching ? 'Buscando...' : 'Buscar mi tema'}</span>
          </button>
        </div>

        {error && <p className="rounded-2xl bg-red-100 p-3 text-tiny text-red-700 font-semibold">{error}</p>}
      </PastelCard>

      {/* Right Understanding Panel (Butter) */}
      <PastelCard tone="butter" className="relative rounded-3xl p-6 flex flex-col justify-between gap-5 text-left overflow-hidden">
        <div className="flex flex-col gap-4">
          <span className="text-tiny font-bold uppercase tracking-wider text-ink-muted">
            ASÍ LO ENTENDEMOS
          </span>

          <div className="rounded-2xl bg-white/90 p-4 text-body-sm text-ink font-medium shadow-xs italic">
            "{lastQuery}"
          </div>

          <div className="flex justify-center my-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white shadow-xs">
              ↓
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {matches?.map((match) => {
              const isSelected = selectedIds.includes(match.topicId)
              const meta = getTopicMetadata(match.topicId)
              const label = labelFor(match.topicId)
              const isDisabled = selectionFull && !isSelected

              return (
                <button
                  key={match.topicId}
                  type="button"
                  role="checkbox"
                  aria-checked={isSelected}
                  aria-disabled={isDisabled}
                  onClick={() =>
                    onSelect({
                      kind: meta.kind,
                      targetId: match.topicId,
                      label,
                      level: meta.level,
                    })
                  }
                  className={cn(
                    'focus-ring flex items-center justify-between gap-3 rounded-2xl bg-white/90 p-4 text-left shadow-xs transition-all border border-transparent cursor-pointer hover:scale-[1.01]',
                    isDisabled && 'cursor-not-allowed opacity-55',
                    isSelected && 'ring-2 ring-ink border-transparent shadow-md',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      aria-hidden="true"
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all',
                        isSelected
                          ? 'border-transparent bg-ink text-white shadow-xs'
                          : 'border-black/30 bg-white/90',
                      )}
                    >
                      {isSelected && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-display text-xl font-extrabold text-ink tracking-tight">
                      {label}
                    </span>
                  </div>

                  <span className="text-tiny text-ink-muted font-semibold">
                    {match.rationale}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-black/10">
          <p className="text-tiny text-ink-secondary font-medium">
            Eliges uno o los dos y tu plan se arma alrededor de ellos.
          </p>
          <Illustration
            className="absolute bottom-4 right-4 h-20 w-auto opacity-15 text-ink pointer-events-none"
            aria-hidden="true"
          />
        </div>
      </PastelCard>
    </div>
  )
}
