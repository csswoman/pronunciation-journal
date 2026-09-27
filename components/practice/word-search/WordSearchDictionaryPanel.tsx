'use client'

// Planned structure:
// <WordSearchDictionaryPanel>
//   <InsetContainer>
//     <CategorySelectorRow label="Área del diccionario" selectControl />
//     <WordPillsRow pills previewCount />
//   </InsetContainer>
//   <ActionRow buttonCTA textNote />
// </WordSearchDictionaryPanel>

import { DICTIONARY_CATEGORIES } from '@/lib/exercises/word-search/dictionary-loader'
import Button from '@/components/ui/Button'
import { ArrowRight, ChevronDown } from '@/components/icons'

interface Props {
  selectedDictId: string
  onSelectDictId: (id: string) => void
  isLoading: boolean
  error: string | null
  onStart: () => void
}

// Sample preview words for popular categories to match design mockup pills
const CATEGORY_PREVIEWS: Record<string, string[]> = {
  'frontend-dev': ['fork', 'middleware', 'hydration', 'portal'],
  'product-design': ['layout', 'component', 'wireframe', 'token'],
  'business-english': ['budget', 'leverage', 'deadline', 'stakeholder'],
  'daily-routine': ['morning', 'coffee', 'commute', 'schedule'],
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

  const previewWords = CATEGORY_PREVIEWS[currentCategory.id] ?? ['word', 'vocabulary', 'practice', 'english']
  const remainingCount = Math.max(0, currentCategory.total - previewWords.length)

  return (
    <div
      id="word-search-panel-dictionary"
      role="tabpanel"
      aria-labelledby="word-search-tab-dictionary"
      tabIndex={0}
      className="flex flex-col gap-5 focus:outline-none"
    >
      {/* Inset group matching Juegos.dc.html */}
      <div className="rounded-2xl bg-surface-sunken p-4 sm:p-5 flex flex-col gap-3.5 border border-border-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label
            htmlFor="word-search-dictionary"
            className="font-heading text-body-md font-bold text-fg shrink-0"
          >
            Área del diccionario
          </label>

          <div className="relative flex-1 min-w-[240px]">
            <select
              id="word-search-dictionary"
              value={selectedDictId}
              onChange={(e) => onSelectDictId(e.target.value)}
              className="focus-ring h-12 w-full appearance-none rounded-xl border border-border-strong bg-surface px-4 pe-10 font-sans text-body-md text-fg shadow-2xs transition-colors"
            >
              {DICTIONARY_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} · {category.total} palabras
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3.5 text-fg-muted">
              <ChevronDown size={18} aria-hidden />
            </div>
          </div>
        </div>

        {/* Word Pills row */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          {previewWords.map((word) => (
            <span
              key={word}
              className="inline-flex items-center rounded-full border border-border-strong bg-surface px-3 py-1 font-sans text-xs font-semibold text-fg shadow-2xs dark:bg-surface-raised dark:border-border-strong dark:text-fg"
            >
              {word}
            </span>
          ))}
          <span className="font-sans text-caption text-fg-muted self-center ps-1">
            +{remainingCount} · se eligen al azar, sin repetir las recientes
          </span>
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-lg border border-error/20 bg-error-soft p-3 text-body-sm text-error">
          {error}
        </p>
      ) : null}

      {/* Action Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pt-1">
        <Button
          variant="primary"
          className="h-14 px-7 text-base font-bold rounded-full gap-2 bg-[#2563eb] text-white hover:bg-[#1d4ed8] shrink-0"
          isLoading={isLoading}
          onClick={onStart}
        >
          <span>{isLoading ? 'Creando tablero…' : 'Comenzar partida'}</span>
          {!isLoading && <ArrowRight size={18} aria-hidden />}
        </Button>

        <span className="font-sans text-caption text-fg-muted">
          Al terminar podrás guardar las palabras en tu cuaderno.
        </span>
      </div>
    </div>
  )
}
