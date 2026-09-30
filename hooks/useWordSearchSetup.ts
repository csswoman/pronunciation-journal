'use client'

import { useRef, useEffect, useState } from 'react'
import type {
  WordSearchDifficulty,
  WordSearchMode,
  WordSearchPuzzle,
  WordSearchSource,
} from '@/lib/exercises/word-search/types'
import type { CefrLevel } from '@/lib/essential-words/types'
import { loadDictionaryPuzzle } from '@/lib/exercises/word-search/dictionary-loader'
import { loadEssentialPuzzle } from '@/lib/exercises/word-search/essential-loader'
import {
  buildCuratedPuzzle,
  buildMyWordsPuzzle,
  requestGeminiPuzzle,
  type PuzzleBuildOptions,
} from '@/lib/exercises/word-search/puzzle-builders'
import {
  MAX_WORD_SEARCH_LENGTH,
  MIN_WORD_SEARCH_ITEMS,
  WORD_COUNT_BY_DIFFICULTY,
  sanitizeWord,
} from '@/lib/exercises/word-search/grid-generator'
import {
  getRecentWordSearchWords,
  saveWordSearchSeenWords,
} from '@/lib/exercises/word-search/seen-words'
import { getMyWords } from '@/lib/word-bank/queries'
import type { WordBankEntry } from '@/lib/word-bank/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { isAnonymousUser } from '@/lib/auth/is-anonymous'

type SourceError = Partial<Record<WordSearchSource, string>>

function isPuzzleFriendlyEntry(entry: WordBankEntry): boolean {
  const clean = sanitizeWord(entry.text)
  return (
    clean.length >= 3 &&
    clean.length <= MAX_WORD_SEARCH_LENGTH &&
    !entry.text.includes(' ') &&
    !entry.text.includes('-')
  )
}

export function useWordSearchSetup(onStartPuzzle: (puzzle: WordSearchPuzzle) => void) {
  const { user } = useAuth()
  const isGuest = isAnonymousUser(user)
  const userId = user?.id ?? null
  // Newest first. Seeded from Dexie so anti-repetition survives reloads.
  const recentWordsRef = useRef<Set<string>>(new Set())
  const [mode, setMode] = useState<WordSearchMode>('classic')
  const [difficulty, setDifficulty] = useState<WordSearchDifficulty>('normal')
  const [source, setSource] = useState<WordSearchSource>('essential')
  const [essentialLevel, setEssentialLevel] = useState<CefrLevel>('A2')
  const [selectedDictId, setSelectedDictId] = useState('professional')
  const [selectedPresetId, setSelectedPresetId] = useState('silent-letters')
  const [customTopic, setCustomTopic] = useState('')
  const [customLevel, setCustomLevel] = useState<
    'beginner' | 'intermediate' | 'advanced'
  >('intermediate')

  const [myWords, setMyWords] = useState<WordBankEntry[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState(!isGuest)
  const [loadingSource, setLoadingSource] = useState<WordSearchSource | null>(null)
  const [errors, setErrors] = useState<SourceError>({})

  useEffect(() => {
    let cancelled = false
    void getRecentWordSearchWords(userId).then((words) => {
      if (!cancelled) {
        recentWordsRef.current = new Set([...recentWordsRef.current, ...words])
      }
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (isGuest) {
      setMyWords([])
      setIsLoadingWords(false)
      return
    }

    let cancelled = false
    setIsLoadingWords(true)
    getMyWords()
      .then((words) => {
        if (!cancelled) setMyWords(words.filter(isPuzzleFriendlyEntry))
      })
      .catch(() => {
        if (cancelled) return
        setMyWords([])
        setErrors((current) => ({
          ...current,
          word_bank: 'No pudimos cargar tu cuaderno en este momento.',
        }))
      })
      .finally(() => {
        if (!cancelled) setIsLoadingWords(false)
      })
    return () => {
      cancelled = true
    }
  }, [isGuest, userId])

  const startWith = async (
    target: WordSearchSource,
    build: (options: PuzzleBuildOptions) => WordSearchPuzzle | Promise<WordSearchPuzzle>,
  ) => {
    setLoadingSource(target)
    setErrors((current) => ({ ...current, [target]: undefined }))
    try {
      const puzzle = await build({
        mode,
        difficulty,
        count: WORD_COUNT_BY_DIFFICULTY[difficulty],
        recentWords: recentWordsRef.current,
      })
      const played = puzzle.items.map((item) => sanitizeWord(item.word))
      recentWordsRef.current = new Set([...played, ...recentWordsRef.current])
      void saveWordSearchSeenWords(userId, played)
      onStartPuzzle(puzzle)
    } catch (error: unknown) {
      setErrors((current) => ({
        ...current,
        [target]: error instanceof Error ? error.message : 'No se pudo crear el tablero.',
      }))
    } finally {
      setLoadingSource(null)
    }
  }

  const handleStartEssential = () =>
    startWith('essential', (options) =>
      loadEssentialPuzzle(essentialLevel, options.mode, options.count, options.recentWords, options.difficulty),
    )

  const handleStartDictionary = () =>
    startWith('dictionary', (options) =>
      loadDictionaryPuzzle(selectedDictId, options.mode, options.count, options.recentWords, options.difficulty),
    )

  const handleStartCurated = () =>
    startWith('curated', (options) => buildCuratedPuzzle(selectedPresetId, options))

  const handleStartMyWords = () => {
    if (myWords.length < MIN_WORD_SEARCH_ITEMS) return Promise.resolve()
    return startWith('word_bank', (options) => buildMyWordsPuzzle(myWords, options))
  }

  const handleStartGemini = () =>
    startWith('gemini', (options) =>
      requestGeminiPuzzle(
        {
          topic: customTopic.trim() || 'Vocabulario útil en inglés',
          level: customLevel,
          knownWords: myWords.map((entry) => entry.text),
        },
        options,
      ),
    )

  return {
    mode,
    setMode,
    difficulty,
    setDifficulty,
    source,
    setSource,
    essentialLevel,
    setEssentialLevel,
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
    loadingSource,
    errors,
    handleStartEssential,
    handleStartDictionary,
    handleStartCurated,
    handleStartMyWords,
    handleStartGemini,
  }
}
