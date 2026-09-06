'use client'

import { useRef, useEffect, useState } from 'react'
import type {
  WordSearchMode,
  WordSearchPuzzle,
  WordSearchSource,
} from '@/lib/exercises/word-search/types'
import {
  WORD_SEARCH_PRESETS,
  CURATED_PUZZLE_ITEMS,
} from '@/lib/exercises/word-search/presets'
import { loadDictionaryPuzzle } from '@/lib/exercises/word-search/dictionary-loader'
import {
  createWordSearchPuzzle,
  MAX_WORD_SEARCH_LENGTH,
  MIN_WORD_SEARCH_ITEMS,
  sanitizeWord,
} from '@/lib/exercises/word-search/grid-generator'
import { pickUnrepeatedWords } from '@/lib/exercises/word-search/word-sampling'
import { getMyWords } from '@/lib/word-bank/queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

export function useWordSearchSetup(onStartPuzzle: (puzzle: WordSearchPuzzle) => void) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const recentWordsRef = useRef<Set<string>>(new Set())
  const [mode, setMode] = useState<WordSearchMode>('classic')
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

  const rememberWords = (words: string[]) => {
    for (const w of words) {
      const clean = sanitizeWord(w)
      if (clean) recentWordsRef.current.add(clean)
    }
  }

  const handleStartDictionary = async () => {
    setIsLoadingDict(true)
    setDictError(null)
    try {
      const puzzle = await loadDictionaryPuzzle(selectedDictId, mode, 8, recentWordsRef.current)
      rememberWords(puzzle.items.map((it) => it.word))
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

    const sampledItems = pickUnrepeatedWords(rawItems, 8, recentWordsRef.current)

    try {
      const puzzle = createWordSearchPuzzle(sampledItems, {
        title: preset.title,
        topic: preset.description,
        source: 'curated',
        mode,
      })
      rememberWords(puzzle.items.map((it) => it.word))
      onStartPuzzle(puzzle)
    } catch (error: unknown) {
      setCuratedError(
        error instanceof Error ? error.message : 'No se pudo crear el tablero.',
      )
    }
  }

  const handleStartMyWords = () => {
    setWordBankError(null)
    if (myWords.length < MIN_WORD_SEARCH_ITEMS) return

    const pool = myWords.map((entry) => ({ ...entry, word: entry.text }))
    const sampled = pickUnrepeatedWords(pool, 8, recentWordsRef.current)

    const items = sampled.map((entry, index) => ({
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
      const puzzle = createWordSearchPuzzle(items, {
        title: 'Mis palabras',
        topic: 'Vocabulario de tu cuaderno personal',
        source: 'word_bank',
        mode,
      })
      rememberWords(puzzle.items.map((it) => it.word))
      onStartPuzzle(puzzle)
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
          count: 8,
          knownWords: myWords.slice(0, 10).map((entry) => entry.text),
          excludeWords: Array.from(recentWordsRef.current).slice(0, 25),
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

      const puzzle = createWordSearchPuzzle(items, {
        title: data.topicTitle || topic,
        topic,
        source: 'gemini',
        mode,
      })
      rememberWords(puzzle.items.map((it) => it.word))
      onStartPuzzle(puzzle)
    } catch (error: unknown) {
      setAiError(
        error instanceof Error ? error.message : 'No se pudo conectar con la IA.',
      )
    } finally {
      setIsGeneratingAi(false)
    }
  }

  return {
    mode,
    setMode,
    source,
    setSource,
    selectedDictId,
    setSelectedDictId,
    selectedPresetId,
    setSelectedPresetId,
    customTopic,
    setCustomTopic,
    customLevel,
    setCustomLevel,
    myWords,
    isLoadingWords,
    isLoadingDict,
    isGeneratingAi,
    aiError,
    dictError,
    curatedError,
    wordBankError,
    handleStartDictionary,
    handleStartCurated,
    handleStartMyWords,
    handleStartGemini,
  }
}
