'use client'

// Planned structure:
// <JournalGuidedTemplateArea>
//   <SentenceFillBlank />
//   <OptionChips />
//   <BracketHint />
// </JournalGuidedTemplateArea>

import type { RefObject } from 'react'
import { Check, Lightbulb, Pencil } from '@/components/icons'
import { cn } from '@/lib/cn'

interface JournalGuidedTemplateAreaProps {
  starterPrefix: string
  options: readonly string[] | string[]
  selectedOption: string
  customText: string
  isCustom: boolean
  inputRef: RefObject<HTMLInputElement | null>
  onSelectOption: (opt: string) => void
  onEnableCustom: () => void
  onCustomTextChange: (text: string) => void
}

export function JournalGuidedTemplateArea({
  starterPrefix,
  options,
  selectedOption,
  customText,
  isCustom,
  inputRef,
  onSelectOption,
  onEnableCustom,
  onCustomTextChange,
}: JournalGuidedTemplateAreaProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-2 font-sans font-h3 font-medium text-fg">
        <span>{starterPrefix}</span>

        {isCustom ? (
          <span className="inline-flex items-baseline">
            <input
              ref={inputRef}
              type="text"
              value={customText}
              onChange={(e) => onCustomTextChange(e.target.value)}
              placeholder="escribe aquí…"
              className="min-w-[140px] border-b-2 border-primary bg-primary-soft/30 px-2 py-0.5 font-sans font-h3 text-fg placeholder:font-sans placeholder:text-body-sm placeholder:text-fg-placeholder focus:outline-none"
            />
          </span>
        ) : (
          <span
            onClick={onEnableCustom}
            className={cn(
              'inline-flex min-h-[32px] min-w-[90px] cursor-pointer items-center justify-center rounded-[var(--radius-sm)] px-2.5 py-0.5 text-center font-sans font-h3 transition-all',
              selectedOption
                ? 'bg-primary-soft text-primary'
                : 'border-b-2 border-primary bg-primary-soft/20 text-transparent',
            )}
          >
            {selectedOption || '___'}
          </span>
        )}

        <span>.</span>
      </div>

      {/* Chips de opciones rápidas */}
      <div className="flex flex-wrap items-center gap-2">
        {options.map((opt) => {
          const isSelected = !isCustom && selectedOption === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onSelectOption(opt)}
              className={cn(
                'focus-ring inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 font-body-sm transition-colors',
                isSelected
                  ? 'border-primary bg-primary-soft font-medium text-primary'
                  : 'border-border-subtle bg-surface-sunken text-fg hover:border-border-strong',
              )}
            >
              {isSelected && <Check size={13} strokeWidth={3} aria-hidden />}
              {opt}
            </button>
          )
        })}

        <button
          type="button"
          onClick={onEnableCustom}
          className={cn(
            'focus-ring inline-flex items-center gap-1.5 rounded-full border border-dashed px-3.5 py-1.5 font-body-sm transition-colors',
            isCustom
              ? 'border-primary bg-primary-soft font-medium text-primary'
              : 'border-border-strong bg-transparent text-fg-muted hover:border-border-default hover:text-fg',
          )}
        >
          <Pencil size={13} aria-hidden />
          otra
        </button>
      </div>

      {/* Hint / Callout de ayuda con corchetes */}
      <div className="flex items-start gap-2.5 rounded-[var(--radius-md)] bg-surface-sunken p-3.5 font-body-sm text-fg-muted">
        <span className="mt-0.5 shrink-0 text-fg-muted">
          <Lightbulb size={16} aria-hidden />
        </span>
        <p className="leading-relaxed">
          ¿No sabes una palabra? Escríbela en español entre corchetes y sigue:{' '}
          <span className="font-mono text-caption text-fg">
            my [cuñado]
          </span>
        </p>
      </div>
    </div>
  )
}
