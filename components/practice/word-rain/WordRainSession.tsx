'use client'

// Planned structure:
// <WordRainSession>
//   {status === 'ready' && <WordRainReadyScreen />}
//   {(status === 'playing' || status === 'paused') && (
//     <WordRainActiveGameLayout>
//       <WordRainHeader />
//       <MainGameGrid>
//         <WordRainArena />
//         <WordRainSavedDrawer />
//       </MainGameGrid>
//     </WordRainActiveGameLayout>
//   )}
//   {(status === 'game_over' || status === 'victory') && <WordRainResults />}
// </WordRainSession>

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { CefrLevel } from '@/lib/essential-words/types'
import { CEFR_LEVELS } from '@/lib/essential-words/types'
import { DIFFICULTY_BY_LEVEL, type RainWord, type WordRainStats, type WordRainStatus } from '@/lib/exercises/word-rain/types'
import { loadWordRainWords } from '@/lib/exercises/word-rain/word-loader'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import Button from '@/components/ui/Button'
import { CloudRain, Play } from '@/components/icons'
import WordRainHeader from './WordRainHeader'
import WordRainArena from './WordRainArena'
import WordRainSavedDrawer from './WordRainSavedDrawer'
import WordRainResults from './WordRainResults'

export default function WordRainSession() {
  const router = useRouter()
  const { preferences, loading: prefsLoading } = useUserPreferences()

  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>('A2')
  const [hasInitializedLevel, setHasInitializedLevel] = useState(false)
  const [status, setStatus] = useState<WordRainStatus>('ready')
  const [words, setWords] = useState<RainWord[]>([])
  const [isLoadingWords, setIsLoadingWords] = useState(false)

  // Game live state
  const [lives, setLives] = useState(3)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [savedWords, setSavedWords] = useState<RainWord[]>([])
  const [missedCount, setMissedCount] = useState(0)
  const [speakOnMatch, setSpeakOnMatch] = useState(true)

  // Sync default level from user profile once loaded
  useEffect(() => {
    if (!prefsLoading && preferences?.cefr_level && !hasInitializedLevel) {
      const userLevel = preferences.cefr_level as CefrLevel
      if (CEFR_LEVELS.includes(userLevel)) {
        setSelectedLevel(userLevel)
      }
      setHasInitializedLevel(true)
    }
  }, [prefsLoading, preferences?.cefr_level, hasInitializedLevel])

  const startNewGame = useCallback(async (level: CefrLevel) => {
    setIsLoadingWords(true)
    try {
      const config = DIFFICULTY_BY_LEVEL[level] ?? DIFFICULTY_BY_LEVEL.A2
      const loaded = await loadWordRainWords(level, config.targetWordsToWin + 10)
      setWords(loaded)
      setLives(config.lives)
      setScore(0)
      setStreak(0)
      setMaxStreak(0)
      setSavedWords([])
      setMissedCount(0)
      setStatus('playing')
    } finally {
      setIsLoadingWords(false)
    }
  }, [])

  const handleWordCompleted = useCallback((word: RainWord, points: number) => {
    setScore((prev) => prev + points)
    setStreak((prev) => {
      const next = prev + 1
      setMaxStreak((currMax) => Math.max(currMax, next))
      return next
    })
    setSavedWords((prev) => [word, ...prev])
  }, [])

  const handleLifeLost = useCallback(() => {
    setStreak(0)
    setMissedCount((prev) => prev + 1)
    setLives((prev) => {
      const nextLives = prev - 1
      if (nextLives <= 0) {
        setStatus('game_over')
      }
      return Math.max(0, nextLives)
    })
  }, [])

  const handleGameFinished = useCallback((isVictory: boolean) => {
    setStatus(isVictory ? 'victory' : 'game_over')
  }, [])

  const currentConfig = DIFFICULTY_BY_LEVEL[selectedLevel] ?? DIFFICULTY_BY_LEVEL.A2
  const totalAttacked = savedWords.length + missedCount
  const accuracy = totalAttacked > 0 ? Math.round((savedWords.length / totalAttacked) * 100) : 100

  const stats: WordRainStats = {
    score,
    streak,
    maxStreak,
    wordsCompleted: savedWords.length,
    wordsMissed: missedCount,
    accuracy,
    wpm: Math.round(savedWords.length * 1.5),
    durationSeconds: 60,
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-6 px-4">
      {status === 'ready' && (
        <section className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-2xl border border-border-subtle bg-surface-raised p-6 text-center shadow-xs md:p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary-soft text-primary shadow-xs">
            <CloudRain size={36} aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-kicker text-tiny uppercase tracking-wider text-primary">
              Mecanografía y Vocabulario
            </span>
            <h1 className="text-h2 font-bold text-fg">Lluvia de palabras</h1>
            <p className="text-body-sm text-fg-muted text-pretty">
              Escribe las palabras en inglés antes de que toquen el suelo. Conforme las aciertas, se van guardando en tu lista de vocabulario aprendido.
            </p>
          </div>

          {/* Selector de nivel CEFR */}
          <div className="flex flex-col gap-2.5 w-full">
            <label className="text-body-xs font-semibold text-fg-muted">
              Nivel de vocabulario:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CEFR_LEVELS.map((lvl) => {
                const isSelected = selectedLevel === lvl
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevel(lvl)}
                    className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border font-mono text-sm font-bold transition-all focus-ring ${
                      isSelected
                        ? 'border-primary bg-primary text-on-primary shadow-xs'
                        : 'border-border-default bg-surface hover:bg-surface-sunken text-fg'
                    }`}
                  >
                    <span>{lvl}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <Button
            variant="primary"
            onClick={() => void startNewGame(selectedLevel)}
            disabled={isLoadingWords}
            className="w-full justify-center text-base py-3"
          >
            <Play size={18} aria-hidden="true" />
            <span>{isLoadingWords ? 'Cargando palabras...' : '¡Empezar a jugar!'}</span>
          </Button>
        </section>
      )}

      {(status === 'playing' || status === 'paused') && (
        <div className="flex flex-col gap-4">
          <WordRainHeader
            stats={{
              lives,
              maxLives: currentConfig.lives,
              score,
              streak,
            }}
            level={selectedLevel}
            isPaused={status === 'paused'}
            speakOnMatch={speakOnMatch}
            onToggleSpeak={() => setSpeakOnMatch((prev) => !prev)}
            onTogglePause={() => setStatus((s) => (s === 'playing' ? 'paused' : 'playing'))}
            onExit={() => setStatus('ready')}
          />

          <div className="flex flex-col lg:flex-row items-start gap-4">
            <div className="flex-1 w-full">
              <WordRainArena
                words={words}
                level={selectedLevel}
                isPaused={status === 'paused'}
                speakOnMatch={speakOnMatch}
                onWordCompleted={handleWordCompleted}
                onLifeLost={handleLifeLost}
                onGameFinished={handleGameFinished}
                targetWordsToWin={currentConfig.targetWordsToWin}
              />
            </div>

            <WordRainSavedDrawer savedWords={savedWords} />
          </div>
        </div>
      )}

      {(status === 'game_over' || status === 'victory') && (
        <WordRainResults
          isVictory={status === 'victory'}
          stats={stats}
          savedWords={savedWords}
          onRestart={() => void startNewGame(selectedLevel)}
          onExit={() => router.push('/practice')}
        />
      )}
    </div>
  )
}
