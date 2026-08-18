'use client'

import React, { useState, useEffect } from 'react'
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
import { createWordSearchPuzzle } from '@/lib/exercises/word-search/grid-generator'
import { getMyWords } from '@/lib/word-bank/queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
  Sparkles,
  BookOpen,
  Layers,
  Loader2,
  Volume2,
} from '@/components/icons'

interface Props {
  onStartPuzzle: (puzzle: WordSearchPuzzle) => void
}

export default function WordSearchSetup({ onStartPuzzle }: Props) {
  const [mode, setMode] = useState<WordSearchMode>('clues')
  const [source, setSource] = useState<WordSearchSource>('dictionary')
  const [selectedDictId, setSelectedDictId] = useState<string>('frontend-dev')
  const [selectedPresetId, setSelectedPresetId] = useState<string>('silent-letters')
  const [customTopic, setCustomTopic] = useState<string>('')
  const [customLevel, setCustomLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate')

  const [myWords, setMyWords] = useState<WordBankEntry[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState<boolean>(true)
  const [isLoadingDict, setIsLoadingDict] = useState<boolean>(false)
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [dictError, setDictError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadWords() {
      try {
        const words = await getMyWords()
        if (!cancelled) {
          setMyWords(words.filter((w) => w.text && w.text.trim().length >= 3 && !w.text.includes(' ')))
        }
      } catch {
        // Fallback for unauthenticated/offline
      } finally {
        if (!cancelled) setIsLoadingWords(false)
      }
    }
    void loadWords()
    return () => {
      cancelled = true
    }
  }, [])

  const handleStartDictionary = async (dictId: string) => {
    setIsLoadingDict(true)
    setDictError(null)
    try {
      const puzzle = await loadDictionaryPuzzle(dictId, mode, 6)
      onStartPuzzle(puzzle)
    } catch (err: unknown) {
      setDictError(err instanceof Error ? err.message : 'Error al cargar diccionario')
    } finally {
      setIsLoadingDict(false)
    }
  }

  const handleStartCurated = (presetId: string) => {
    const preset = WORD_SEARCH_PRESETS.find((p) => p.id === presetId) || WORD_SEARCH_PRESETS[0]
    const rawItems = CURATED_PUZZLE_ITEMS[preset.id] || CURATED_PUZZLE_ITEMS['silent-letters']

    const puzzle = createWordSearchPuzzle(rawItems, {
      title: preset.title,
      topic: preset.description,
      source: 'curated',
      mode,
    })

    onStartPuzzle(puzzle)
  }

  const handleStartMyWords = () => {
    if (myWords.length === 0) return

    // Shuffle and pick 5 to 7 words
    const shuffled = [...myWords].sort(() => Math.random() - 0.5).slice(0, 6)
    const items = shuffled.map((w, idx) => ({
      id: `my-${w.id || idx}`,
      word: w.text,
      displayWord: w.text,
      ipa: w.ipa,
      clue: w.meaning || w.translation || `Palabra de tu vocabulario: ${w.text}`,
      meaningEs: w.translation || w.meaning,
      exampleSentence: w.example,
    }))

    const puzzle = createWordSearchPuzzle(items, {
      title: 'Mis Palabras Guardadas',
      topic: 'Vocabulario de tu banco personal',
      source: 'word_bank',
      mode,
    })

    onStartPuzzle(puzzle)
  }

  const handleStartGemini = async () => {
    const topic = customTopic.trim() || 'Vocabulario útil en inglés'
    setIsGeneratingAi(true)
    setAiError(null)

    try {
      const res = await fetch('/api/practice/word-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          level: customLevel,
          count: 6,
          knownWords: myWords.slice(0, 10).map((w) => w.text),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Error ${res.status}`)
      }

      const data = await res.json()
      const items = data.words.map((w: { word: string; ipa?: string; clue: string; meaningEs: string; exampleSentence: string }, idx: number) => ({
        id: `ai-${idx}`,
        word: w.word,
        displayWord: w.word.toLowerCase(),
        ipa: w.ipa,
        clue: w.clue,
        meaningEs: w.meaningEs,
        exampleSentence: w.exampleSentence,
      }))

      const puzzle = createWordSearchPuzzle(items, {
        title: data.topicTitle || topic,
        topic,
        source: 'gemini',
        mode,
      })

      onStartPuzzle(puzzle)
    } catch (err: unknown) {
      setAiError(
        err instanceof Error ? err.message : 'No se pudo conectar con la IA'
      )
    } finally {
      setIsGeneratingAi(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-layout-section-gap">
      {/* Mode selection */}
      <section className="flex flex-col gap-layout-stack-tight" aria-labelledby="word-search-mode-label">
        <p id="word-search-mode-label" className="font-kicker text-fg-muted">
          Modalidad de juego
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('clues')}
            aria-pressed={mode === 'clues'}
            className={`
              flex min-h-28 flex-col gap-2 rounded-lg border p-layout-card-pad text-left transition-all cursor-pointer
              ${
                mode === 'clues'
                  ? 'border-primary bg-primary-soft ring-1 ring-primary/30'
                  : 'border-border-subtle bg-surface-raised hover:border-border-strong hover:bg-surface-sunken'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="text-label font-semibold text-fg">Modo Pistas</span>
                <span className="rounded-sm bg-primary px-1.5 py-0.5 font-mono text-tiny font-bold text-on-primary">
                Recomendado
              </span>
            </div>
            <p className="text-body-sm text-fg-muted">
              Deduce las palabras a partir de su significado o fonética antes de encontrarlas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('classic')}
            aria-pressed={mode === 'classic'}
            className={`
              flex min-h-28 flex-col gap-2 rounded-lg border p-layout-card-pad text-left transition-all cursor-pointer
              ${
                mode === 'classic'
                  ? 'border-primary bg-primary-soft ring-1 ring-primary/30'
                  : 'border-border-subtle bg-surface-raised hover:border-border-strong hover:bg-surface-sunken'
              }
            `}
          >
            <span className="text-label font-semibold text-fg">Sopa Clásica</span>
            <p className="text-body-sm text-fg-muted">
              Búsqueda visual directa con la lista de palabras y su IPA visible.
            </p>
          </button>
        </div>
      </section>

      {/* Source selection */}
      <section className="flex flex-col gap-layout-stack" aria-labelledby="word-search-source-label">
        <div>
          <p id="word-search-source-label" className="font-kicker text-fg-muted">
          Origen del vocabulario
          </p>
        </div>

        {/* Source Tabs */}
        <div className="grid grid-cols-2 gap-1 rounded-lg border border-border-subtle bg-surface-sunken p-1">
          <button
            type="button"
            onClick={() => setSource('dictionary')}
            aria-pressed={source === 'dictionary'}
            className={`
              flex min-h-14 items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-semibold transition-all cursor-pointer
              ${
                source === 'dictionary'
                  ? 'bg-primary text-on-primary'
                  : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
              }
            `}
          >
            <BookOpen className="h-4 w-4" />
            <span>Diccionario</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('word_bank')}
            aria-pressed={source === 'word_bank'}
            className={`
              flex min-h-14 items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-semibold transition-all cursor-pointer
              ${
                source === 'word_bank'
                  ? 'bg-primary text-on-primary'
                  : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
              }
            `}
          >
            <Layers className="h-4 w-4" />
            <span>Mis Palabras ({myWords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('curated')}
            aria-pressed={source === 'curated'}
            className={`
              flex min-h-14 items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-semibold transition-all cursor-pointer
              ${
                source === 'curated'
                  ? 'bg-primary text-on-primary'
                  : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
              }
            `}
          >
            <Volume2 className="h-4 w-4" />
            <span>Fonética</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('gemini')}
            aria-pressed={source === 'gemini'}
            className={`
              flex min-h-14 items-center justify-center gap-2 rounded-md px-3 py-2 text-body-sm font-semibold transition-all cursor-pointer
              ${
                source === 'gemini'
                  ? 'bg-primary text-on-primary'
                  : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
              }
            `}
          >
            <Sparkles className="h-4 w-4" />
            <span>Crear IA</span>
          </button>
        </div>

        {/* Tab content 1: Dictionary / Lexicon Areas */}
        {source === 'dictionary' && (
          <div className="flex flex-col gap-layout-stack">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DICTIONARY_CATEGORIES.map((cat) => {
                const isSelected = selectedDictId === cat.id
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedDictId(cat.id)}
                    className={`
                      flex min-h-16 items-center gap-3 rounded-md border p-3 text-left transition-all cursor-pointer
                      ${
                        isSelected
                          ? 'border-primary bg-primary-soft ring-1 ring-primary/30'
                          : 'border-border-subtle bg-surface-raised hover:border-border-strong hover:bg-surface-sunken'
                      }
                    `}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface-sunken text-label font-bold"
                        style={{ color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-label font-semibold text-fg truncate">
                          {cat.name}
                        </span>
                        <span className="text-caption text-fg-muted">
                          {cat.total} palabras
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {dictError && (
              <div className="p-3 rounded-lg bg-error-soft text-error text-xs border border-error/20">
                {dictError}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-border-subtle pt-layout-stack sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-sm text-fg-muted">Seis palabras, pistas en español y pronunciación al encontrarlas.</p>
              <Button
                variant="primary"
                className="w-full shrink-0 sm:w-auto"
                disabled={isLoadingDict}
                onClick={() => handleStartDictionary(selectedDictId)}
              >
                {isLoadingDict ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando área...</span>
                  </div>
                ) : (
                  <span>Empezar búsqueda</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Tab content 2: Curated Phonetic Presets */}
        {source === 'curated' && (
          <div className="flex flex-col gap-layout-stack">
            {WORD_SEARCH_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`
                    flex items-start justify-between gap-3 rounded-lg border p-layout-card-pad transition-all cursor-pointer
                    ${
                      isSelected
                        ? 'bg-primary-soft/20 border-primary ring-1 ring-primary/30'
                        : 'bg-surface-raised border-border-subtle hover:bg-surface-sunken'
                    }
                  `}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-label font-semibold text-fg">
                      {preset.title}
                    </span>
                    <p className="text-body-sm text-fg-muted">
                      {preset.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-sm border border-border-subtle bg-surface-sunken px-2 py-1 font-mono text-caption text-fg-subtle">
                    {preset.level}
                  </span>
                </div>
              )
            })}

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => handleStartCurated(selectedPresetId)}
              >
                Comenzar Búsqueda
              </Button>
            </div>
          </div>
        )}

        {/* Tab content 3: Word Bank */}
        {source === 'word_bank' && (
          <div className="flex flex-col gap-layout-stack-loose rounded-lg border border-border-subtle bg-surface-raised p-layout-card-pad">
            <div className="flex flex-col gap-1">
              <h4 className="text-label font-semibold text-fg">
                Vocabulario de tu cuaderno
              </h4>
              <p className="text-body-sm text-fg-muted">
                Generaremos una cuadrícula personalizada con las palabras que has ido guardando y practicando en tus sesiones.
              </p>
            </div>

            {isLoadingWords ? (
              <div className="flex items-center justify-center gap-2 py-6 text-body-sm text-fg-muted">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Cargando tus palabras...</span>
              </div>
            ) : myWords.length >= 3 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg bg-surface-sunken border border-border-subtle">
                  {myWords.slice(0, 15).map((w) => (
                    <span
                      key={w.id}
                    className="rounded-sm border border-border-subtle bg-surface-raised px-2 py-1 text-caption text-fg-muted"
                    >
                      {w.text}
                    </span>
                  ))}
                  {myWords.length > 15 && (
                    <span className="px-2 py-1 text-caption text-fg-subtle">
                      +{myWords.length - 15} más
                    </span>
                  )}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleStartMyWords}
                >
                  Jugar con mis palabras
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 py-2">
                <p className="text-body-sm text-fg-muted">
                  Tienes pocas palabras guardadas en tu banco (mínimo 3). Puedes usar una de las áreas del diccionario o generar un reto con IA.
                </p>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setSource('dictionary')}
                >
                  Ver áreas del Diccionario
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab content 4: Gemini AI */}
        {source === 'gemini' && (
          <div className="flex flex-col gap-layout-stack-loose rounded-lg border border-border-subtle bg-surface-raised p-layout-card-pad">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="text-label font-semibold text-fg">
                  Generar reto personalizado con Gemini
                </h4>
              </div>
              <p className="text-body-sm text-fg-muted">
                Escribe cualquier tema o área de interés y la IA creará una sopa de letras con pistas y fonética.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                label="Tema o contexto"
                value={customTopic}
                onChange={(val) => setCustomTopic(val)}
                placeholder="ej. Entrevistas de trabajo, En el restaurante, Silent K..."
              />

              <div className="flex flex-col gap-1">
                <label className="text-label font-semibold text-fg">Nivel</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCustomLevel(lvl)}
                      className={`
                        min-h-11 flex-1 rounded-md border px-2 py-1.5 text-body-sm font-semibold transition-all cursor-pointer capitalize
                        ${
                          customLevel === lvl
                            ? 'bg-primary-soft text-primary border-primary'
                            : 'bg-surface-sunken text-fg-muted border-border-subtle hover:text-fg'
                        }
                      `}
                    >
                      {lvl === 'beginner' ? 'Básico' : lvl === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                    </button>
                  ))}
                </div>
              </div>

              {aiError && (
                <div className="p-3 rounded-lg bg-error-soft text-error text-xs border border-error/20">
                  {aiError}
                </div>
              )}

              <Button
                variant="primary"
                className="w-full mt-1"
                disabled={isGeneratingAi}
                onClick={handleStartGemini}
              >
                {isGeneratingAi ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generando sopa con IA...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Crear sopa con Gemini</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
