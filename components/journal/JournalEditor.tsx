'use client'

// Planned structure:
// <JournalEditor>
//   <NotebookSheet>          ← borde + líneas de renglón + foco-ring
//     <JournalVocabOverlay/> ← highlights de vocab (absolute, pointer-events-none)
//     <TextArea />           ← texto real (caret visible, text-fg)
//     <EditorFooter>
//       <ProgressBar />
//       <WordCounter + SubmitButton />
//     </EditorFooter>
//   </NotebookSheet>
//   <SaveStatus />
// </JournalEditor>

import { useId, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'
import type { SaveState } from '@/hooks/useJournalEntry'
import { PillButton } from '@/components/ui/PillButton'
import { JournalVocabOverlay } from './JournalVocabOverlay'

interface JournalEditorProps {
  content: string
  onChange: (next: string) => void
  saveState: SaveState
  wordCount: number
  targetLength: number
  disabled?: boolean
  /** Ctrl/⌘+Enter cuando el draft puede enviarse. */
  onSubmitShortcut?: () => void
  /** Handler del botón Revisar en el footer. Undefined = no mostrar el botón. */
  onSubmit?: () => void
  /** Texto del botón de acción (por defecto "Revisar"). */
  submitLabel?: string
  /** Si el botón muestra spinner de carga. */
  isSubmitting?: boolean
  /** Palabras de vocabulario objetivo para resaltado inline. */
  vocabWords?: string[]
}

const SAVE_COPY: Record<SaveState, string> = {
  saved: 'Guardado en este dispositivo. Se sincronizará cuando haya conexión.',
  pending: 'Guardando…',
  error: 'No se pudo guardar. Sigue escribiendo para reintentarlo.',
}

// Line height en rem del textarea (leading-relaxed = 1.625)
// Se usa en el linear-gradient para las líneas de cuaderno.
const NOTEBOOK_LINE_H = '1.625rem'

/** Presentational autosave textarea designed like a personal journal page. */
export function JournalEditor({
  content,
  onChange,
  saveState,
  wordCount,
  targetLength,
  disabled,
  onSubmitShortcut,
  onSubmit,
  submitLabel = 'Revisar',
  isSubmitting = false,
  vocabWords = [],
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
      {/* Notebook sheet: border + ruled lines + focus ring */}
      <div
        className={cn(
          'group relative overflow-hidden rounded-[var(--radius-lg)] border border-border-strong bg-surface-base shadow-sm transition-all',
          'focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20',
        )}
        // Líneas de renglón como cuaderno — se generan con repeating-linear-gradient.
        // El offset de padding-top (p-5 = 1.25rem) hace que las líneas arranquen
        // alineadas con la primera línea de texto.
        style={{
          backgroundImage: `repeating-linear-gradient(
            to bottom,
            transparent 0,
            transparent calc(${NOTEBOOK_LINE_H} - 1px),
            var(--border-subtle) calc(${NOTEBOOK_LINE_H} - 1px),
            var(--border-subtle) ${NOTEBOOK_LINE_H}
          )`,
          backgroundSize: `100% ${NOTEBOOK_LINE_H}`,
          backgroundPositionY: '1.25rem', // coincide con pt-5 del textarea
          backgroundAttachment: 'local',
        }}
      >
        {/* Overlay de vocab — resalta palabras usadas inline */}
        {vocabWords.length > 0 && (
          <JournalVocabOverlay content={content} vocabWords={vocabWords} />
        )}

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
            // El textarea tiene bg-transparent para que se vean las líneas y el overlay.
            // text-fg normal — el overlay queda DETRÁS (z-0 vs. el textarea en z-10),
            // así que el color del texto se ve encima del highlight.
            'relative z-10 w-full resize-none bg-transparent p-5 font-body text-base leading-relaxed text-fg placeholder:text-fg-placeholder focus:outline-none',
            'disabled:cursor-not-allowed disabled:opacity-60',
          )}
        />

        {/* Footer: barra hairline + contador + botón Revisar */}
        <div className="relative z-10 border-t border-border-subtle bg-surface-base/80 px-4 py-2.5 backdrop-blur-sm">
          {/* Barra de progreso hairline */}
          <div className="mb-2.5 h-0.5 w-full overflow-hidden rounded-full bg-surface-sunken">
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

          {/* Estado de corrección en curso — reasegura durante la espera de la IA */}
          {isSubmitting && (
            <p role="status" className="mb-2 flex items-center gap-1.5 font-body-sm text-fg-muted">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary motion-reduce:animate-none" aria-hidden />
              Buscando la mejor forma de decirlo…
            </p>
          )}

          {/* Contador + botón */}
          <div className="flex items-center justify-between gap-2">
            <p
              className="font-body-sm tabular-nums text-fg-muted"
              aria-live="polite"
            >
              {wordCount} / {targetLength}
              {meetsTarget && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 font-body-xs font-semibold text-success">
                  Meta alcanzada
                </span>
              )}
            </p>

            {/* Botón Revisar — solo cuando hay texto */}
            {onSubmit && hasContent && (
              <PillButton
                variant="primary"
                size="sm"
                onClick={onSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {isSubmitting ? 'Leyendo…' : submitLabel}
              </PillButton>
            )}
          </div>
        </div>
      </div>

      {/* Estado de guardado */}
      {showStatus && (
        <div
          id={statusId}
          role={saveState === 'error' ? 'alert' : 'status'}
          className="flex items-center justify-between gap-2 px-1 font-body-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'h-1.5 w-1.5 shrink-0 rounded-full',
                saveState === 'saved' && 'bg-success',
                saveState === 'pending' && 'animate-pulse bg-warning',
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
