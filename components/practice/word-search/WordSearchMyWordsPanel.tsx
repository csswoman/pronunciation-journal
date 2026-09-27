'use client'

// Planned structure:
// <WordSearchMyWordsPanel>
//   <InsetContainer>
//     <PanelHeader title="Tu cuaderno de vocabulario" />
//     <WordsPreviewGroup chips count />
//   </InsetContainer>
//   <ActionRow buttonCTA textNote />
// </WordSearchMyWordsPanel>

import type { WordBankEntry } from '@/lib/word-bank/types'
import Button from '@/components/ui/Button'
import { ArrowRight, Layers, Loader2 } from '@/components/icons'

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
      className="flex flex-col gap-4 focus:outline-none"
      aria-busy={isLoading || undefined}
    >
      <div className="rounded-2xl bg-surface-sunken p-4 sm:p-5 flex flex-col gap-3.5 border border-border-subtle">
        <div className="flex items-center gap-2">
          <Layers className="h-4.5 w-4.5 text-primary shrink-0" aria-hidden />
          <h3 className="font-heading text-body-md font-bold text-fg">Tu cuaderno de vocabulario</h3>
        </div>

        {isLoading ? (
          <div
            className="flex min-h-20 items-center justify-center gap-2 font-sans text-body-sm text-fg-muted"
            role="status"
          >
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
            <span>Cargando tus palabras…</span>
          </div>
        ) : myWords.length >= minWordsRequired ? (
          <div className="flex flex-col gap-3">
            <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
              {myWords.slice(0, 16).map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex items-center rounded-full border border-border-strong bg-surface px-3 py-1 font-sans text-xs font-semibold text-fg shadow-2xs dark:bg-surface-raised dark:border-border-strong dark:text-fg"
                >
                  {entry.text}
                </span>
              ))}
              {myWords.length > 16 ? (
                <span className="self-center px-2 py-1 font-sans text-caption font-semibold text-fg-muted">
                  +{myWords.length - 16} más
                </span>
              ) : null}
            </div>

            <span className="font-sans text-caption text-fg-muted">
              {myWords.length} palabras disponibles para elegir al azar.
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <p className="font-sans text-body-sm text-fg-muted">
              Necesitas al menos {minWordsRequired} palabras aptas guardadas en tu cuaderno para armar una partida.
            </p>
            <Button variant="secondary" onClick={onGoToDictionary}>
              Explorar el diccionario
            </Button>
          </div>
        )}
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}

      {myWords.length >= minWordsRequired && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pt-1">
          <Button
            variant="primary"
            className="h-14 px-7 text-base font-bold rounded-full gap-2 bg-[#2563eb] text-white hover:bg-[#1d4ed8] shrink-0"
            onClick={onStart}
          >
            <span>Comenzar partida</span>
            <ArrowRight size={18} aria-hidden />
          </Button>

          <span className="font-sans text-caption text-fg-muted">
            Al completar el tablero, cada palabra cuenta como repaso SRS.
          </span>
        </div>
      )}
    </div>
  )
}
