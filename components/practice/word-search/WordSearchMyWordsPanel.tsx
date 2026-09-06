'use client'

// Planned structure:
// <WordSearchMyWordsPanel>
//   <PanelHeader />         (título y subtítulo sobre el cuaderno personal)
//   <WordsPreviewGroup />   (chips de palabras disponibles o estado vacío guiado)
//   <PanelAction />         (botón primary o sugerencia de ir al diccionario)
// </WordSearchMyWordsPanel>

import type { WordBankEntry } from '@/lib/word-bank/types'
import Button from '@/components/ui/Button'
import { Layers, Loader2 } from '@/components/icons'

interface Props {
  isLoading: boolean
  myWords: WordBankEntry[]
  minWordsRequired: number
  error: string | null
  onStart: () => void
  onGoToDictionary: () => void
}

export default function WordSearchMyWordsPanel({
  isLoading,
  myWords,
  minWordsRequired,
  error,
  onStart,
  onGoToDictionary,
}: Props) {
  return (
    <div
      id="word-search-panel-word_bank"
      role="tabpanel"
      aria-labelledby="word-search-tab-word_bank"
      tabIndex={0}
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs focus:outline-none sm:p-5"
      aria-busy={isLoading || undefined}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-h4 font-bold text-fg">Tu cuaderno de vocabulario</h3>
        </div>
        <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Genera un tablero exclusivo con las palabras que has guardado mientras practicas en English Journal.
        </p>
      </div>

      {isLoading ? (
        <div
          className="flex min-h-24 items-center justify-center gap-2 text-body-sm text-fg-muted"
          role="status"
        >
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
          <span>Cargando tus palabras…</span>
        </div>
      ) : myWords.length >= minWordsRequired ? (
        <div className="flex flex-col gap-3">
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-border-subtle/60 bg-surface-sunken p-2.5">
            {myWords.slice(0, 16).map((entry) => (
              <span
                key={entry.id}
                className="rounded-md border border-border-subtle bg-surface-raised px-2.5 py-1 font-mono text-caption text-fg shadow-2xs"
              >
                {entry.text}
              </span>
            ))}
            {myWords.length > 16 ? (
              <span className="self-center px-2 py-1 text-caption text-fg-muted">
                +{myWords.length - 16} más
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-caption text-fg-muted">
              {myWords.length} palabras disponibles para seleccionar 6 al azar.
            </span>
            <Button variant="primary" onClick={onStart}>
              Crear con mis palabras
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-lg border border-border-subtle/80 bg-surface-sunken p-4">
          <p className="text-pretty text-body-sm text-fg-muted">
            Necesitas al menos {minWordsRequired} palabras aptas (sin espacios ni guiones) guardadas en tu cuaderno para armar una partida.
          </p>
          <Button variant="secondary" onClick={onGoToDictionary}>
            Explorar el diccionario
          </Button>
        </div>
      )}

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
