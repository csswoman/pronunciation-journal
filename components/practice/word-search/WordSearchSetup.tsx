'use client'

import {
  useEffect,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import type {
  WordSearchMode,
  WordSearchPuzzle,
  WordSearchSource,
} from '@/lib/exercises/word-search/types'
import {
  WORD_SEARCH_PRESETS,
  CURATED_PUZZLE_ITEMS,
} from '@/lib/exercises/word-search/presets'
import {
  DICTIONARY_CATEGORIES,
  loadDictionaryPuzzle,
} from '@/lib/exercises/word-search/dictionary-loader'
import {
  createWordSearchPuzzle,
  MAX_WORD_SEARCH_LENGTH,
  MIN_WORD_SEARCH_ITEMS,
  sanitizeWord,
} from '@/lib/exercises/word-search/grid-generator'
import { getMyWords } from '@/lib/word-bank/queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import {
  BookOpen,
  Check,
  Layers,
  Loader2,
  Sparkles,
  Volume2,
} from '@/components/icons'

interface Props {
  onStartPuzzle: (puzzle: WordSearchPuzzle) => void
}

interface SourceTabProps {
  source: WordSearchSource
  activeSource: WordSearchSource
  label: string
  icon: ReactNode
  onSelect: (source: WordSearchSource) => void
  ariaLabel?: string
}

const LEVEL_LABELS = {
  beginner: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
} as const

const SOURCE_ORDER: WordSearchSource[] = [
  'dictionary',
  'word_bank',
  'curated',
  'gemini',
]

function randomSample<T>(items: T[], count: number): T[] {
  const sampled = [...items]
  for (let index = sampled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    const current = sampled[index]
    sampled[index] = sampled[swapIndex]
    sampled[swapIndex] = current
  }
  return sampled.slice(0, count)
}

function SourceTab({
  source,
  activeSource,
  label,
  icon,
  onSelect,
  ariaLabel,
}: SourceTabProps) {
  const isSelected = source === activeSource

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = SOURCE_ORDER.indexOf(source)
    let nextSource: WordSearchSource | undefined

    if (event.key === 'ArrowRight') {
      nextSource = SOURCE_ORDER[(currentIndex + 1) % SOURCE_ORDER.length]
    } else if (event.key === 'ArrowLeft') {
      nextSource = SOURCE_ORDER[
        (currentIndex - 1 + SOURCE_ORDER.length) % SOURCE_ORDER.length
      ]
    } else if (event.key === 'Home') {
      nextSource = SOURCE_ORDER[0]
    } else if (event.key === 'End') {
      nextSource = SOURCE_ORDER[SOURCE_ORDER.length - 1]
    }

    if (!nextSource) return
    event.preventDefault()
    onSelect(nextSource)
    window.requestAnimationFrame(() => {
      document.getElementById(`word-search-tab-${nextSource}`)?.focus()
    })
  }

  return (
    <button
      type="button"
      id={`word-search-tab-${source}`}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`word-search-panel-${source}`}
      aria-label={ariaLabel}
      tabIndex={isSelected ? 0 : -1}
      onClick={() => onSelect(source)}
      onKeyDown={handleKeyDown}
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-2 py-2 text-caption font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none sm:px-3 sm:text-body-sm ${
        isSelected
          ? 'border border-border-subtle/70 bg-surface-raised text-fg shadow-xs'
          : 'text-fg-muted hover:bg-surface-raised/60 hover:text-fg'
      }`}
    >
      <span aria-hidden>{icon}</span>
      <span>{label}</span>
    </button>
  )
}

export default function WordSearchSetup({ onStartPuzzle }: Props) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const [mode, setMode] = useState<WordSearchMode>('clues')
  const [source, setSource] = useState<WordSearchSource>('dictionary')
  const [selectedDictId, setSelectedDictId] = useState('frontend-dev')
  const [selectedPresetId, setSelectedPresetId] = useState('silent-letters')
  const [customTopic, setCustomTopic] = useState('')
  const [customLevel, setCustomLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate')

  const [myWords, setMyWords] = useState<WordBankEntry[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState(!isGuest)
  const [isLoadingDict, setIsLoadingDict] = useState(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dictError, setDictError] = useState<string | null>(null)
  const [curatedError, setCuratedError] = useState<string | null>(null)
  const [wordBankError, setWordBankError] = useState<string | null>(null)

  useEffect(() => {
    if (isGuest) {
      setMyWords([])
      setIsLoadingWords(false)
      return
    }

    let cancelled = false
    setIsLoadingWords(true)

    async function loadWords() {
      try {
        const words = await getMyWords()
        if (!cancelled) {
          setMyWords(
            words.filter((entry) => {
              const clean = sanitizeWord(entry.text)
              return (
                clean.length >= 3 &&
                clean.length <= MAX_WORD_SEARCH_LENGTH &&
                !entry.text.includes(' ') &&
                !entry.text.includes('-')
              )
            }),
          )
        }
      } catch {
        if (!cancelled) {
          setMyWords([])
          setWordBankError('No pudimos cargar tu cuaderno en este momento.')
        }
      } finally {
        if (!cancelled) setIsLoadingWords(false)
      }
    }

    void loadWords()
    return () => {
      cancelled = true
    }
  }, [isGuest, user?.id])

  const selectedDictionary =
    DICTIONARY_CATEGORIES.find((category) => category.id === selectedDictId) ??
    DICTIONARY_CATEGORIES[0]

  const handleStartDictionary = async () => {
    setIsLoadingDict(true)
    setDictError(null)
    try {
      const puzzle = await loadDictionaryPuzzle(selectedDictId, mode, 6)
      onStartPuzzle(puzzle)
    } catch (error: unknown) {
      setDictError(
        error instanceof Error ? error.message : 'No se pudo crear el tablero.',
      )
    } finally {
      setIsLoadingDict(false)
    }
  }

  const handleStartCurated = () => {
    setCuratedError(null)
    const preset = WORD_SEARCH_PRESETS.find((item) => item.id === selectedPresetId)
    const rawItems = preset ? CURATED_PUZZLE_ITEMS[preset.id] : undefined

    if (!preset || !rawItems?.length) {
      setCuratedError('Este tema todavía no tiene contenido preparado.')
      return
    }

    try {
      onStartPuzzle(
        createWordSearchPuzzle(rawItems, {
          title: preset.title,
          topic: preset.description,
          source: 'curated',
          mode,
        }),
      )
    } catch (error: unknown) {
      setCuratedError(
        error instanceof Error ? error.message : 'No se pudo crear el tablero.',
      )
    }
  }

  const handleStartMyWords = () => {
    setWordBankError(null)
    if (myWords.length < MIN_WORD_SEARCH_ITEMS) return

    const items = randomSample(myWords, 6).map((entry, index) => ({
      id: `my-${entry.id || index}`,
      word: entry.text,
      displayWord: entry.text,
      ipa: entry.ipa,
      clue:
        entry.meaning ||
        entry.translation ||
        `Palabra de tu cuaderno: ${entry.text}`,
      meaningEs: entry.translation || entry.meaning,
      exampleSentence: entry.example,
    }))

    try {
      onStartPuzzle(
        createWordSearchPuzzle(items, {
          title: 'Mis palabras',
          topic: 'Vocabulario de tu cuaderno personal',
          source: 'word_bank',
          mode,
        }),
      )
    } catch (error: unknown) {
      setWordBankError(
        error instanceof Error ? error.message : 'No se pudo crear el tablero.',
      )
    }
  }

  const handleStartGemini = async () => {
    const topic = customTopic.trim() || 'Vocabulario útil en inglés'
    setIsGeneratingAi(true)
    setAiError(null)

    try {
      const response = await fetch('/api/gemini/word-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level: customLevel,
          count: 6,
          knownWords: myWords.slice(0, 10).map((entry) => entry.text),
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `Error ${response.status}`)
      }

      const data = await response.json()
      const items = data.words.map(
        (
          word: {
            word: string
            ipa?: string
            clue: string
            meaningEs: string
            exampleSentence: string
          },
          index: number,
        ) => ({
          id: `ai-${index}`,
          word: word.word,
          displayWord: word.word.toLowerCase(),
          ipa: word.ipa,
          clue: word.clue,
          meaningEs: word.meaningEs,
          exampleSentence: word.exampleSentence,
        }),
      )

      onStartPuzzle(
        createWordSearchPuzzle(items, {
          title: data.topicTitle || topic,
          topic,
          source: 'gemini',
          mode,
        }),
      )
    } catch (error: unknown) {
      setAiError(
        error instanceof Error ? error.message : 'No se pudo conectar con la IA.',
      )
    } finally {
      setIsGeneratingAi(false)
    }
  }

  const panelProps = (panelSource: WordSearchSource) => ({
    id: `word-search-panel-${panelSource}`,
    role: 'tabpanel' as const,
    'aria-labelledby': `word-search-tab-${panelSource}`,
    tabIndex: 0,
  })

  return (
    <div className="flex w-full flex-col gap-layout-section-gap">
      <fieldset className="flex flex-col gap-layout-stack-tight">
        <legend className="font-kicker text-fg-muted">1. Cómo jugar</legend>
        <p className="text-pretty text-body-sm text-fg-muted">
          Puedes buscar las respuestas directamente o deducirlas antes con una pista.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setMode('clues')}
            aria-pressed={mode === 'clues'}
            className={`focus-ring flex min-h-28 flex-col gap-3 rounded-xl border p-layout-card-pad text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
              mode === 'clues'
                ? 'border-primary bg-primary-soft shadow-xs'
                : 'border-border-subtle bg-surface-raised hover:border-border-default hover:bg-surface-sunken'
            }`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-label font-semibold text-fg">Con pistas</span>
              <div className="flex items-center gap-1.5">
                <Badge label="Recomendado" />
                {mode === 'clues' ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                ) : null}
              </div>
            </span>
            <span className="text-pretty text-body-sm text-fg-muted">
              Descifra cada palabra por su definición o sonido antes de encontrarla.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setMode('classic')}
            aria-pressed={mode === 'classic'}
            className={`focus-ring flex min-h-28 flex-col gap-3 rounded-xl border p-layout-card-pad text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
              mode === 'classic'
                ? 'border-primary bg-primary-soft shadow-xs'
                : 'border-border-subtle bg-surface-raised hover:border-border-default hover:bg-surface-sunken'
            }`}
          >
            <span className="flex w-full items-center justify-between gap-2">
              <span className="text-label font-semibold text-fg">Lista visible</span>
              {mode === 'classic' ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-on-primary">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
              ) : null}
            </span>
            <span className="text-pretty text-body-sm text-fg-muted">
              Mira las palabras y su IPA mientras entrenas el reconocimiento ortográfico.
            </span>
          </button>
        </div>
      </fieldset>

      <section className="flex flex-col gap-layout-stack" aria-labelledby="word-search-source-label">
        <div className="flex flex-col gap-1">
          <h2 id="word-search-source-label" className="font-kicker text-fg-muted">
            2. Elige el vocabulario
          </h2>
          <p className="text-pretty text-body-sm text-fg-muted">
            Cada partida usa seis palabras y genera un tablero nuevo.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Origen del vocabulario"
          className="grid grid-cols-2 gap-1 rounded-xl border border-border-subtle bg-surface-sunken p-1 sm:grid-cols-4"
        >
          <SourceTab
            source="dictionary"
            activeSource={source}
            label="Diccionario"
            icon={<BookOpen className="h-4 w-4" />}
            onSelect={setSource}
          />
          <SourceTab
            source="word_bank"
            activeSource={source}
            label="Mis palabras"
            icon={<Layers className="h-4 w-4" />}
            onSelect={setSource}
            ariaLabel={`Mis palabras, ${myWords.length} disponibles`}
          />
          <SourceTab
            source="curated"
            activeSource={source}
            label="Fonética"
            icon={<Volume2 className="h-4 w-4" />}
            onSelect={setSource}
          />
          <SourceTab
            source="gemini"
            activeSource={source}
            label="Con IA"
            icon={<Sparkles className="h-4 w-4" />}
            onSelect={setSource}
          />
        </div>

        {source === 'dictionary' ? (
          <div
            {...panelProps('dictionary')}
            className="flex flex-col gap-layout-stack rounded-lg border border-border-subtle bg-surface-raised p-layout-card-pad focus:outline-none"
          >
            <div className="grid gap-layout-stack sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="flex min-w-0 flex-col gap-1.5">
                <label htmlFor="word-search-dictionary" className="text-label font-semibold text-fg">
                  Área del diccionario
                </label>
                <select
                  id="word-search-dictionary"
                  value={selectedDictId}
                  onChange={(event) => setSelectedDictId(event.target.value)}
                  className="focus-ring min-h-12 w-full rounded-sm border border-border-default bg-surface-sunken px-3 py-2 text-body-md text-fg transition-colors sm:text-body-sm"
                >
                  {DICTIONARY_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} · {category.total} palabras
                    </option>
                  ))}
                </select>
                <p className="text-pretty text-caption text-fg-muted">
                  Se elegirán 6 de {selectedDictionary?.total ?? 0} palabras. Las definiciones se mantienen en inglés para reforzar comprensión.
                </p>
              </div>
              <Button
                variant="primary"
                className="w-full sm:w-auto"
                isLoading={isLoadingDict}
                onClick={() => void handleStartDictionary()}
              >
                {isLoadingDict ? 'Creando tablero…' : 'Crear tablero'}
              </Button>
            </div>
            {dictError ? (
              <p role="alert" className="rounded-md border border-error/20 bg-error-soft p-3 text-body-sm text-error">
                {dictError}
              </p>
            ) : null}
          </div>
        ) : null}

        {source === 'curated' ? (
          <div
            {...panelProps('curated')}
            className="flex flex-col gap-layout-stack focus:outline-none"
          >
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Tema fonético">
              {WORD_SEARCH_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id
                return (
                  <button
                    key={preset.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedPresetId(preset.id)}
                    className={`focus-ring flex min-h-28 flex-col gap-2 rounded-xl border p-layout-card-pad text-left transition-[background-color,border-color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none ${
                      isSelected
                        ? 'border-primary bg-primary-soft shadow-xs'
                        : 'border-border-subtle bg-surface-raised hover:border-border-default hover:bg-surface-sunken'
                    }`}
                  >
                    <span className="flex w-full items-start justify-between gap-3">
                      <span className="text-label font-semibold text-fg">{preset.title}</span>
                      <Badge label={LEVEL_LABELS[preset.level]} variant="neutral" />
                    </span>
                    <span className="text-pretty text-body-sm text-fg-muted">
                      {preset.description}
                    </span>
                  </button>
                )
              })}
            </div>
            {curatedError ? (
              <p role="alert" className="rounded-md border border-error/20 bg-error-soft p-3 text-body-sm text-error">
                {curatedError}
              </p>
            ) : null}
            <Button variant="primary" className="w-full sm:self-end sm:w-auto" onClick={handleStartCurated}>
              Crear tablero fonético
            </Button>
          </div>
        ) : null}

        {source === 'word_bank' ? (
          <div
            {...panelProps('word_bank')}
            className="flex flex-col gap-layout-stack rounded-lg border border-border-subtle bg-surface-raised p-layout-card-pad focus:outline-none"
            aria-busy={isLoadingWords || undefined}
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-h4 text-fg">Tu cuaderno</h3>
              <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
                Practica las palabras que guardaste en otras partes de English Journal.
              </p>
            </div>

            {isLoadingWords ? (
              <div className="flex min-h-24 items-center justify-center gap-2 text-body-sm text-fg-muted" role="status">
                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
                <span>Cargando tus palabras…</span>
              </div>
            ) : myWords.length >= MIN_WORD_SEARCH_ITEMS ? (
              <>
                <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-md bg-surface-sunken p-2">
                  {myWords.slice(0, 15).map((entry) => (
                    <span key={entry.id} className="rounded-sm bg-surface-raised px-2 py-1 text-caption text-fg-muted">
                      {entry.text}
                    </span>
                  ))}
                  {myWords.length > 15 ? (
                    <span className="px-2 py-1 text-caption text-fg-subtle">
                      +{myWords.length - 15} más
                    </span>
                  ) : null}
                </div>
                <Button variant="primary" className="w-full sm:self-end sm:w-auto" onClick={handleStartMyWords}>
                  Crear con mis palabras
                </Button>
              </>
            ) : (
              <div className="flex flex-col items-start gap-3 rounded-md bg-surface-sunken p-3">
                <p className="text-pretty text-body-sm text-fg-muted">
                  Aún no hay {MIN_WORD_SEARCH_ITEMS} palabras aptas para crear una partida. Puedes empezar con el diccionario.
                </p>
                <Button variant="secondary" onClick={() => setSource('dictionary')}>
                  Usar el diccionario
                </Button>
              </div>
            )}

            {wordBankError ? (
              <p role="alert" className="rounded-md border border-error/20 bg-error-soft p-3 text-body-sm text-error">
                {wordBankError}
              </p>
            ) : null}
          </div>
        ) : null}

        {source === 'gemini' ? (
          <div
            {...panelProps('gemini')}
            className="flex flex-col gap-layout-stack rounded-lg border border-border-subtle bg-surface-raised p-layout-card-pad focus:outline-none"
          >
            <div className="flex flex-col gap-1">
              <h3 className="text-h4 text-fg">Reto personalizado</h3>
              <p className="max-w-prose text-pretty text-body-sm text-fg-muted">
                Describe un contexto y Gemini preparará seis palabras con pistas, significado e IPA cuando esté disponible.
              </p>
            </div>

            <Input
              label="Tema o contexto"
              value={customTopic}
              onChange={setCustomTopic}
              placeholder="Ej.: entrevistas de trabajo o pedir en un restaurante"
            />

            <fieldset className="flex flex-col gap-1.5">
              <legend className="text-label font-semibold text-fg">Nivel del vocabulario</legend>
              <div className="grid grid-cols-3 gap-2" role="radiogroup">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    role="radio"
                    aria-checked={customLevel === level}
                    onClick={() => setCustomLevel(level)}
                    className={`focus-ring min-h-11 rounded-lg border px-2 py-1.5 text-caption font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out-quart active:scale-[0.98] motion-reduce:transform-none sm:text-body-sm ${
                      customLevel === level
                        ? 'border-primary bg-primary-soft text-primary shadow-xs'
                        : 'border-border-subtle bg-surface-sunken text-fg-muted hover:bg-surface-base hover:text-fg'
                    }`}
                  >
                    {LEVEL_LABELS[level]}
                  </button>
                ))}
              </div>
            </fieldset>

            {aiError ? (
              <p role="alert" className="rounded-md border border-error/20 bg-error-soft p-3 text-body-sm text-error">
                {aiError}
              </p>
            ) : null}

            <Button
              variant="primary"
              className="w-full sm:self-end sm:w-auto"
              isLoading={isGeneratingAi}
              onClick={() => void handleStartGemini()}
            >
              {isGeneratingAi ? 'Preparando reto…' : 'Crear con Gemini'}
            </Button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
