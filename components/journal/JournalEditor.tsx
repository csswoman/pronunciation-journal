'use client'

import { useId } from 'react'
import { cn } from '@/lib/cn'
import type { SaveState } from '@/hooks/useJournalEntry'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  disabled?: boolean
}

const SAVE_COPY: Record<SaveState, string> = {
  saved: 'Guardado localmente',
  pending: 'Guardando cambios…',
  error: 'No se pudo guardar localmente. Sigue escribiendo para reintentarlo.',
}

/** Presentational autosave textarea. Lifecycle lives in useJournalEntry. */
export function JournalEditor({ content, onChange, saveState, disabled }: JournalEditorProps) {
  const fieldId = useId()
  const statusId = useId()

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="font-body-sm font-medium text-fg-muted">
        Tu entrada de hoy
      </label>
      <textarea
        id={fieldId}
        value={content}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={12}
        aria-describedby={statusId}
        placeholder="Escribe libremente en inglés…"
        className={cn(
          'w-full resize-y rounded-[var(--radius-lg)] border border-border-default bg-surface-sunken p-4 text-base text-fg placeholder:text-fg-placeholder',
          'transition-colors duration-150 focus-ring disabled:cursor-not-allowed disabled:opacity-60',
        )}
      />
      <p
        id={statusId}
        role={saveState === 'error' ? 'alert' : 'status'}
        className={cn('font-body-sm', saveState === 'error' ? 'text-error' : 'text-fg-muted')}
      >
        {SAVE_COPY[saveState]}
      </p>
    </div>
  )
}
