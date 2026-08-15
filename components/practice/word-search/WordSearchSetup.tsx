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
  Search,
  Loader2,
  FolderInput,
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
    <div className="flex flex-col gap-6 w-full max-w-xl mx-auto">
      {/* Mode selection */}
      <div className="flex flex-col gap-2">
        <label className="font-kicker text-fg-muted uppercase tracking-wider text-xs">
          Modalidad de juego
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setMode('clues')}
            className={`
              p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5
              ${
                mode === 'clues'
                  ? 'bg-primary-soft/30 border-primary shadow-sm ring-1 ring-primary/40'
                  : 'bg-surface-raised border-border-subtle hover:bg-surface-sunken'
              }
            `}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-fg">Modo Pistas</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary text-on-primary font-bold">
                Recomendado
              </span>
            </div>
            <p className="text-xs text-fg-muted leading-relaxed">
              Deduce las palabras a partir de su significado o fonética antes de encontrarlas.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setMode('classic')}
            className={`
              p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1.5
              ${
                mode === 'classic'
                  ? 'bg-primary-soft/30 border-primary shadow-sm ring-1 ring-primary/40'
                  : 'bg-surface-raised border-border-subtle hover:bg-surface-sunken'
              }
            `}
          >
            <span className="font-semibold text-sm text-fg">Sopa Clásica</span>
            <p className="text-xs text-fg-muted leading-relaxed">
              Búsqueda visual directa con la lista de palabras y su IPA visible.
            </p>
          </button>
        </div>
      </div>

      {/* Source selection */}
      <div className="flex flex-col gap-3">
        <label className="font-kicker text-fg-muted uppercase tracking-wider text-xs">
          Origen del vocabulario
        </label>

        {/* Source Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 rounded-xl p-1 bg-surface-sunken border border-border-subtle gap-1">
          <button
            type="button"
            onClick={() => setSource('dictionary')}
            className={`
              py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5
              ${
                source === 'dictionary'
                  ? 'bg-surface-raised text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }
            `}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>Diccionario</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('word_bank')}
            className={`
              py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5
              ${
                source === 'word_bank'
                  ? 'bg-surface-raised text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }
            `}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mis Palabras ({myWords.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('curated')}
            className={`
              py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5
              ${
                source === 'curated'
                  ? 'bg-surface-raised text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }
            `}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Fonética</span>
          </button>

          <button
            type="button"
            onClick={() => setSource('gemini')}
            className={`
              py-2 px-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5
              ${
                source === 'gemini'
                  ? 'bg-surface-raised text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              }
            `}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Crear IA</span>
          </button>
        </div>

        {/* Tab content 1: Dictionary / Lexicon Areas */}
        {source === 'dictionary' && (
          <div className="flex flex-col gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DICTIONARY_CATEGORIES.map((cat) => {
                const isSelected = selectedDictId === cat.id
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedDictId(cat.id)}
                    className={`
                      p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5
                      ${
                        isSelected
                          ? 'bg-primary-soft/20 border-primary ring-1 ring-primary/30'
                          : 'bg-surface-raised border-border-subtle hover:bg-surface-sunken'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-surface-sunken border border-border-subtle"
                        style={{ color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-fg truncate">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-fg-muted">
                          {cat.total} palabras
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {dictError && (
              <div className="p-3 rounded-lg bg-error-soft text-error text-xs border border-error/20">
                {dictError}
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full"
                disabled={isLoadingDict}
                onClick={() => handleStartDictionary(selectedDictId)}
              >
                {isLoadingDict ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Cargando área...</span>
                  </div>
                ) : (
                  <span>Jugar con esta área del Diccionario</span>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Tab content 2: Curated Phonetic Presets */}
        {source === 'curated' && (
          <div className="flex flex-col gap-2.5">
            {WORD_SEARCH_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id
              return (
                <div
                  key={preset.id}
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`
                    p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3
                    ${
                      isSelected
                        ? 'bg-primary-soft/20 border-primary ring-1 ring-primary/30'
                        : 'bg-surface-raised border-border-subtle hover:bg-surface-sunken'
                    }
                  `}
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <span className="font-semibold text-sm text-fg">
                      {preset.title}
                    </span>
                    <p className="text-xs text-fg-muted leading-relaxed">
                      {preset.description}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-sunken text-fg-subtle border border-border-subtle shrink-0">
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
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-surface-raised border border-border-subtle">
            <div className="flex flex-col gap-1">
              <h4 className="text-sm font-semibold text-fg">
                Vocabulario de tu cuaderno
              </h4>
              <p className="text-xs text-fg-muted leading-relaxed">
                Generaremos una cuadrícula personalizada con las palabras que has ido guardando y practicando en tus sesiones.
              </p>
            </div>

            {isLoadingWords ? (
              <div className="flex items-center justify-center py-6 text-fg-muted text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Cargando tus palabras...</span>
              </div>
            ) : myWords.length >= 3 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 rounded-lg bg-surface-sunken border border-border-subtle">
                  {myWords.slice(0, 15).map((w) => (
                    <span
                      key={w.id}
                      className="text-xs px-2 py-0.5 rounded-md bg-surface-raised border border-border-subtle text-fg-muted"
                    >
                      {w.text}
                    </span>
                  ))}
                  {myWords.length > 15 && (
                    <span className="text-xs px-2 py-0.5 text-fg-subtle">
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
                <p className="text-xs text-fg-muted">
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
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-surface-raised border border-border-subtle">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-semibold text-fg">
                  Generar reto personalizado con Gemini
                </h4>
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
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
                <label className="text-xs font-semibold text-fg">Nivel</label>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setCustomLevel(lvl)}
                      className={`
                        flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize
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
                    <span>Crear Sopa con Gemini</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
