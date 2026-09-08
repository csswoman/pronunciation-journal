'use client'

// Planned structure:
// <WordSearchDictionaryPanel>
//   <PanelHeader />         (título y descripción del área)
//   <CategorySelector />    (selector estilo Inset Grouped)
//   <CategorySummary />     (conteo de palabras y nota formativa)
//   <PanelAction />         (botón primary para iniciar partida)
// </WordSearchDictionaryPanel>

import { DICTIONARY_CATEGORIES } from '@/lib/exercises/word-search/dictionary-loader'
import Button from '@/components/ui/Button'
import { BookOpen } from '@/components/icons'

interface Props {
  selectedDictId: string
  onSelectDictId: (id: string) => void
  isLoading: boolean
  error: string | null
  onStart: () => void
}

export default function WordSearchDictionaryPanel({
  selectedDictId,
  onSelectDictId,
  isLoading,
  error,
  onStart,
}: Props) {
  const currentCategory =
    DICTIONARY_CATEGORIES.find((c) => c.id === selectedDictId) ?? DICTIONARY_CATEGORIES[0]

  return (
    <div
      id="word-search-panel-dictionary"
      role="tabpanel"
      aria-labelledby="word-search-tab-dictionary"
      tabIndex={0}
      className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-raised p-4 shadow-xs focus:outline-none sm:p-5"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" aria-hidden />
          <h3 className="text-h4 font-bold text-fg">Diccionario temático</h3>
        </div>
        <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
          Selecciona un campo semántico profesional o cotidiano. El generador extraerá seis palabras con sus definiciones contextuales.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="word-search-dictionary" className="text-label font-semibold text-fg">
            Área de vocabulario
          </label>
          <div className="relative">
            <select
              id="word-search-dictionary"
              value={selectedDictId}
              onChange={(e) => onSelectDictId(e.target.value)}
              className="focus-ring min-h-12 w-full appearance-none rounded-lg border border-border-default bg-surface-sunken px-3.5 pe-10 py-2.5 text-body-md text-fg shadow-2xs transition-colors sm:text-body-sm"
            >
              {DICTIONARY_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.total} palabras)
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-fg-muted">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          <p className="text-pretty text-caption text-fg-muted">
            {currentCategory?.total ?? 0} palabras preparadas. Las pistas respetan la inmersión en inglés.
          </p>
        </div>

        <Button
          variant="primary"
          className="w-full sm:w-auto"
          isLoading={isLoading}
          onClick={onStart}
        >
          {isLoading ? 'Creando tablero…' : 'Comenzar partida'}
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  )
}
