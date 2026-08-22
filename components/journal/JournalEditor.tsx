'use client'

// Planned structure:
// <JournalEditor>
//   <EditorToolbar>
//     <PageLabel />
//     <HintsToggle />
//   </EditorToolbar>
//   <EditorPaperSheet>
//     <TextArea />
//     <EditorFooter>
//       <ProgressBar />
//       <WordCounter />
//     </EditorFooter>
//   </EditorPaperSheet>
//   <SaveStatus />
// </JournalEditor>

import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import { Checkbox } from '@/components/ui/Checkbox'
import type { SaveState } from '@/hooks/useJournalEntry'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  wordCount: number
  targetLength: number
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

/** Presentational autosave textarea designed like a personal journal page. */
export function JournalEditor({
  content,
  onChange,
  saveState,
  wordCount,
  targetLength,
  hintsEnabled,
  onHintsEnabledChange,
  disabled,
  onSubmitShortcut,
}: JournalEditorProps) {
  const fieldId = useId()
  const statusId = useId()
  const hasContent = content.trim().length > 0
  const showStatus = saveState !== 'saved' || hasContent
  const meetsTarget = wordCount >= targetLength
  const progressPercent = Math.min(100, Math.max(0, Math.round((wordCount / targetLength) * 100)))

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (!onSubmitShortcut) return
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      onSubmitShortcut()
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <label htmlFor={fieldId} className="font-kicker text-fg-subtle">
          Tu página de hoy
        </label>
        <Checkbox
          checked={hintsEnabled}
          onCheckedChange={onHintsEnabledChange}
          label="Mostrar pistas mientras escribo"
        />
      </div>

      <div className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-surface-base shadow-sm transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
        <textarea
          id={fieldId}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={11}
          lang="en"
          spellCheck
          aria-describedby={showStatus ? statusId : undefined}
          placeholder={hasContent ? '' : 'Empieza a escribir…'}
          className={cn(
            'w-full resize-y bg-transparent p-5 font-body text-base leading-relaxed text-fg placeholder:text-fg-placeholder focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />

        {/* Word progress track & footer */}
        <div className="border-t border-border-subtle bg-surface-sunken/40 px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-body-xs font-medium text-fg-subtle">Meta de hoy</span>
              {meetsTarget ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 font-body-xs font-semibold text-success">
                  Meta alcanzada
                </span>
              ) : null}
            </div>
            <p className="font-body-sm tabular-nums text-fg-muted" aria-live="polite">
              {wordCount} / {targetLength} palabras
            </p>
          </div>

          {/* Dynamic visual progress bar */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn(
                'h-full transition-all duration-300 ease-out',
                meetsTarget ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${progressPercent}%` }}
              role="progressbar"
              aria-valuenow={wordCount}
              aria-valuemin={0}
              aria-valuemax={targetLength}
              aria-label="Progreso de palabras"
            />
          </div>
        </div>
      </div>

      {showStatus && (
        <div
          id={statusId}
          role={saveState === 'error' ? 'alert' : 'status'}
          className="flex items-center justify-between gap-2 px-1 font-body-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full shrink-0',
                saveState === 'saved' && 'bg-success',
                saveState === 'pending' && 'bg-warning animate-pulse',
                saveState === 'error' && 'bg-error',
              )}
              aria-hidden
            />
            <span className={cn(saveState === 'error' ? 'text-error' : 'text-fg-muted')}>
              {SAVE_COPY[saveState]}
            </span>
          </div>

          {onSubmitShortcut && saveState === 'saved' && hasContent ? (
            <span className="hidden items-center gap-1 text-fg-subtle sm:inline-flex">
              <kbd className="rounded border border-border-subtle bg-surface-sunken px-1.5 py-0.5 font-mono text-caption text-fg-muted">
                Ctrl/⌘+Enter
              </kbd>{' '}
              para revisar
            </span>
          ) : null}
        </div>
      )}
    </div>
  )
}
