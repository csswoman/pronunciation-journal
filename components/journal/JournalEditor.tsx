'use client'

import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { Checkbox } from '@/components/ui/Checkbox'
import type { SaveState } from '@/hooks/useJournalEntry'
import type { WritingScaffold } from '@/lib/journal/writing-scaffold'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  wordCount: number
  targetLength: number
  structure: WritingScaffold['structure']
  hintsEnabled: boolean
  onHintsEnabledChange: (enabled: boolean) => void
  disabled?: boolean
  /** Ctrl/⌘+Enter when the draft can be submitted. */
  onSubmitShortcut?: () => void
}

const SAVE_COPY: Record<SaveState, string> = {
  saved: 'Guardado en este dispositivo. Se sincronizará cuando haya conexión.',
  pending: 'Guardando…',
  error: 'No se pudo guardar. Sigue escribiendo para reintentarlo.',
}

/** Presentational autosave textarea. Lifecycle lives in useJournalEntry. */
export function JournalEditor({
  content,
  onChange,
  saveState,
  wordCount,
  targetLength,
  structure,
  hintsEnabled,
  onHintsEnabledChange,
  disabled,
  onSubmitShortcut,
}: JournalEditorProps) {
  const fieldId = useId()
  const statusId = useId()
  const hasContent = content.trim().length > 0
  const showStatus = saveState !== 'saved' || hasContent
  const writingPlaceholder = structure
    .map((item, index) => `${index + 1}. ${item.label}: ${item.hint}`)
    .join('\n')

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!onSubmitShortcut) return
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSubmitShortcut()
    }
  }

  return (
    <div className="flex max-w-[68ch] flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="font-body-sm font-medium text-fg-muted">
          Tu página de hoy
        </label>
        <Checkbox
          checked={hintsEnabled}
          onCheckedChange={onHintsEnabledChange}
          label="Mostrar pistas mientras escribo"
        />
      </div>
      <textarea
        id={fieldId}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={10}
        lang="en"
        spellCheck
        aria-describedby={showStatus ? statusId : undefined}
        placeholder={hasContent ? '' : writingPlaceholder}
        className={cn(
          'w-full resize-y rounded-[var(--radius-lg)] border border-border-strong bg-surface-base p-4 text-base text-fg placeholder:text-fg-placeholder',
          'transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
        )}
      />
      <p className="font-body-sm tabular-nums text-fg-muted" aria-live="polite">
        {wordCount} / {targetLength} palabras
      </p>
      {showStatus && (
        <p
          id={statusId}
          role={saveState === 'error' ? 'alert' : 'status'}
          className={cn('font-body-sm', saveState === 'error' ? 'text-error' : 'text-fg-muted')}
        >
          {SAVE_COPY[saveState]}
          {onSubmitShortcut && saveState === 'saved' && hasContent ? (
            <span className="text-fg-subtle"> · Ctrl/⌘+Enter para revisar</span>
          ) : null}
        </p>
      )}
    </div>
  )
}
