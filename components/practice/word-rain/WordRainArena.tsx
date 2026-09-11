'use client'

// Planned structure:
// <WordRainArena>
//   <SkyPlayArea>
//     <WordRainFallingWord (list with distractors support) />
//     <GroundImpactLine />
//     <TrapWarningBanner />
//   </SkyPlayArea>
//   <TypingInputBar>
//     <TypingInputField />
//     <TypingFeedbackHelper />
//   </TypingInputBar>
// </WordRainArena>

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CefrLevel } from '@/lib/essential-words/types'
import { DIFFICULTY_BY_LEVEL, type FallingWordItem, type RainWord } from '@/lib/exercises/word-rain/types'
import { getRandomDistractor } from '@/lib/exercises/word-rain/word-loader'
import WordRainFallingWord from './WordRainFallingWord'

interface WordRainArenaProps {
  words: RainWord[]
  level: CefrLevel
  isPaused: boolean
  speakOnMatch: boolean
  onWordCompleted: (word: RainWord, points: number) => void
  onLifeLost: () => void
  onGameFinished: (isVictory: boolean) => void
  targetWordsToWin: number
}

function playSpeech(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  } catch {
    // SpeechSynthesis can fail gracefully
  }
}

function playTone(type: 'success' | 'miss') {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === 'success') {
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
    } else {
      osc.frequency.setValueAtTime(220, ctx.currentTime) // A3
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.18)
      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch {
    // AudioContext can be blocked until user gesture, safely ignore
  }
}

export default function WordRainArena({
  words,
  level,
  isPaused,
  speakOnMatch,
  onWordCompleted,
  onLifeLost,
  onGameFinished,
  targetWordsToWin,
}: WordRainArenaProps) {
  const config = DIFFICULTY_BY_LEVEL[level] ?? DIFFICULTY_BY_LEVEL.A2
  const [fallingItems, setFallingItems] = useState<FallingWordItem[]>([])
  const [inputVal, setInputVal] = useState('')
  const [trapWarning, setTrapWarning] = useState(false)
  const [lastTrapWord, setLastTrapWord] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const wordPoolRef = useRef<RainWord[]>(words)
  const poolIndexRef = useRef<number>(0)
  const completedCountRef = useRef<number>(0)
  const lastSpawnTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const isPausedRef = useRef<boolean>(isPaused)

  useEffect(() => {
    isPausedRef.current = isPaused
  }, [isPaused])

  useEffect(() => {
    wordPoolRef.current = words
  }, [words])

  // Focus input automatically
  useEffect(() => {
    if (!isPaused) {
      inputRef.current?.focus()
    }
  }, [isPaused])

  const spawnWord = useCallback((now: number) => {
    if (wordPoolRef.current.length === 0) return

    // Decide if spawning a distractor/trap word
    const isDistractor = Math.random() < config.distractorChance
    const xPercent = Math.floor(Math.random() * 65) + 18 // 18% to 83%

    if (isDistractor) {
      const trapWord = getRandomDistractor()
      const newItem: FallingWordItem = {
        id: `distractor-${trapWord}-${now}`,
        word: trapWord,
        cefr_level: level,
        xPercent,
        yPercent: 0,
        speed: config.baseSpeed * 0.9,
        isDistractor: true,
      }
      setFallingItems((prev) => [...prev, newItem])
    } else {
      const currentWord = wordPoolRef.current[poolIndexRef.current % wordPoolRef.current.length]
      poolIndexRef.current += 1

      const newItem: FallingWordItem = {
        id: `${currentWord.id}-${now}`,
        word: currentWord.word,
        ipa: currentWord.ipa,
        cefr_level: currentWord.cefr_level,
        xPercent,
        yPercent: 0,
        speed: config.baseSpeed + (Math.random() * 0.04 - 0.02),
      }
      setFallingItems((prev) => [...prev, newItem])
    }

    lastSpawnTimeRef.current = now
  }, [config.baseSpeed, config.distractorChance, level])

  // Physics animation loop
  useEffect(() => {
    let lastTick = performance.now()

    const loop = (now: number) => {
      const delta = Math.min(now - lastTick, 100)
      lastTick = now

      if (!isPausedRef.current) {
        // Check spawn
        setFallingItems((prev) => {
          if (
            prev.length < config.maxSimultaneousWords &&
            now - lastSpawnTimeRef.current > config.spawnIntervalMs
          ) {
            spawnWord(now)
          }

          // Advance positions
          const nextItems: FallingWordItem[] = []
          let lostLife = false

          for (const item of prev) {
            if (item.isMatched) continue // already caught

            const nextY = item.yPercent + item.speed * (delta / 16.66)
            if (nextY >= 88) {
              // Only normal words cost a life if missed; distractors expire safely
              if (!item.isDistractor) {
                lostLife = true
              }
            } else {
              nextItems.push({ ...item, yPercent: nextY })
            }
          }

          if (lostLife) {
            playTone('miss')
            onLifeLost()
          }

          return nextItems
        })
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [config.maxSimultaneousWords, config.spawnIntervalMs, onLifeLost, spawnWord])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputVal(val)

    const cleanVal = val.trim().toLowerCase()
    if (!cleanVal) return

    // Check match in active falling items
    const matchedIndex = fallingItems.findIndex(
      (item) => !item.isMatched && item.word.toLowerCase() === cleanVal
    )

    if (matchedIndex !== -1) {
      const matched = fallingItems[matchedIndex]

      if (matched.isDistractor) {
        // Player typed a trap word: penalize
        playTone('miss')
        setLastTrapWord(matched.word)
        setTrapWarning(true)
        setTimeout(() => setTrapWarning(false), 1500)
        onLifeLost()

        setFallingItems((prev) =>
          prev.map((item, idx) =>
            idx === matchedIndex ? { ...item, isMatched: true } : item
          )
        )
        setInputVal('')
        return
      }

      // Successful normal word match
      playTone('success')
      if (speakOnMatch) {
        playSpeech(matched.word)
      }

      const heightBonus = Math.max(10, Math.round(100 - matched.yPercent))
      const points = 50 + heightBonus

      setFallingItems((prev) =>
        prev.map((item, idx) =>
          idx === matchedIndex ? { ...item, isMatched: true } : item
        )
      )

      setInputVal('')
      completedCountRef.current += 1

      const sourceWord = wordPoolRef.current.find((w) => w.word === matched.word) ?? {
        id: matched.id,
        word: matched.word,
        ipa: matched.ipa,
        cefr_level: matched.cefr_level,
      }

      onWordCompleted(sourceWord, points)

      if (completedCountRef.current >= targetWordsToWin) {
        onGameFinished(true)
      }
    }
  }

  return (
    <div className="relative flex flex-col h-[480px] w-full rounded-2xl border border-border-default bg-surface-sunken/40 overflow-hidden shadow-inner">
      {/* Sky Play Area */}
      <div className="relative flex-1 w-full overflow-hidden">
        {fallingItems.map((item) => (
          <WordRainFallingWord key={item.id} item={item} typedText={inputVal} />
        ))}

        {/* Impact ground warning boundary line */}
        <div
          className="absolute left-0 right-0 top-[88%] h-px bg-error/30 border-b border-dashed border-error/40 pointer-events-none"
          aria-hidden="true"
        />

        {/* Trap penalty warning banner */}
        {trapWarning && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-error/95 px-3.5 py-1.5 font-caption text-xs font-bold text-on-error shadow-md animate-bounce z-20">
            ¡Cuidado! &quot;{lastTrapWord}&quot; era un distractor (-1 vida)
          </div>
        )}
      </div>

      {/* Typing Input Bar */}
      <div className="relative z-10 flex flex-col gap-1.5 p-4 border-t border-border-subtle bg-surface-raised/95 backdrop-blur-xs">
        <div className="relative flex items-center justify-center max-w-md mx-auto w-full">
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            disabled={isPaused}
            placeholder={isPaused ? 'Juego en pausa...' : 'Escribe las palabras aquí...'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="w-full rounded-xl border border-border-default bg-surface px-4 py-3 text-center text-body font-bold text-fg placeholder:text-fg-subtle placeholder:font-normal shadow-xs focus-ring transition-all"
            aria-label="Escribe las palabras que van cayendo"
          />
        </div>
        <p className="text-center font-caption text-tiny text-fg-subtle">
          Escribe las palabras válidas; ¡atento a la ortografía para evitar distractores!
        </p>
      </div>
    </div>
  )
}
