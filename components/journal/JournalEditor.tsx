'use client'

import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import type { SaveState } from '@/hooks/useJournalEntry'
import { useWritingHints } from '@/hooks/useWritingHints'
import { useWritingHintsPreference } from '@/hooks/useWritingHintsPreference'
import { WritingHintsOverlay } from './WritingHintsOverlay'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  disabled?: boolean
  /** Ctrl/⌘+Enter when the draft can be submitted. */
  onSubmitShortcut?: () => void
}

const SAVE_COPY: Record<SaveState, string> = {
  saved: 'Guardado en este dispositivo',
  pending: 'Guardando…',
  error: 'No se pudo guardar. Sigue escribiendo para reintentarlo.',
}

/** Presentational autosave textarea. Lifecycle lives in useJournalEntry. */
export function JournalEditor({
  content,
  onChange,
  saveState,
  disabled,
  onSubmitShortcut,
}: JournalEditorProps) {
  const fieldId = useId()
  const statusId = useId()
  const hasContent = content.trim().length > 0
  const showStatus = saveState !== 'saved' || hasContent
  const { enabled: hintsEnabled, setEnabled: setHintsEnabled } = useWritingHintsPreference()
  const hints = useWritingHints(content, hintsEnabled && !disabled)

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!onSubmitShortcut) return
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSubmitShortcut()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="font-body-sm font-medium text-fg-muted">
          Tu página de hoy
        </label>
        <label className="flex items-center gap-1.5 font-body-sm text-fg-subtle">
          <input
            type="checkbox"
            checked={hintsEnabled}
            onChange={(e) => setHintsEnabled(e.target.checked)}
            className="focus-ring"
          />
          Mostrar pistas mientras escribo
        </label>
      </div>
      <div className="relative rounded-[var(--radius-lg)] bg-surface-sunken">
        <WritingHintsOverlay content={content} matches={hints} />
        <textarea
          id={fieldId}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={10}
          aria-describedby={showStatus ? statusId : undefined}
          placeholder="Escribe en inglés sobre lo de arriba…"
          className={cn(
            'relative z-[1] w-full resize-y rounded-[var(--radius-lg)] border border-border-default bg-transparent p-4 text-base text-fg placeholder:text-fg-placeholder',
            'transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />
      </div>
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
