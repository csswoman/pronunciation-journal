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
import { playSpeech, playTone } from '@/lib/exercises/word-rain/audio'
import WordRainPlayfield from './WordRainPlayfield'

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

  const fallingItemsRef = useRef<FallingWordItem[]>([])
  const wordPoolRef = useRef<RainWord[]>(words)
  const poolIndexRef = useRef<number>(0)
  const completedCountRef = useRef<number>(0)
  const lastSpawnTimeRef = useRef<number>(0)
  const animFrameRef = useRef<number | null>(null)
  const isPausedRef = useRef<boolean>(isPaused)

  const commitFallingItems = useCallback((items: FallingWordItem[]) => {
    fallingItemsRef.current = items
    setFallingItems(items)
  }, [])

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

  const spawnWord = useCallback((now: number): FallingWordItem | null => {
    if (wordPoolRef.current.length === 0) return null

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
      lastSpawnTimeRef.current = now
      return newItem
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
      lastSpawnTimeRef.current = now
      return newItem
    }
  }, [config.baseSpeed, config.distractorChance, level])

  // Physics animation loop
  useEffect(() => {
    let lastTick = performance.now()

    const loop = (now: number) => {
      const delta = Math.min(now - lastTick, 100)
      lastTick = now

      if (!isPausedRef.current) {
        let items = fallingItemsRef.current
        if (
          items.length < config.maxSimultaneousWords &&
          now - lastSpawnTimeRef.current > config.spawnIntervalMs
        ) {
          const spawnedItem = spawnWord(now)
          if (spawnedItem) items = [...items, spawnedItem]
        }

        const nextItems: FallingWordItem[] = []
        for (const item of items) {
          if (item.isMatched) continue // already caught
          if (item.isMissed) {
            nextItems.push(item)
            continue
          }

          const nextY = item.yPercent + item.speed * (delta / 16.66)
          if (nextY >= 88) {
            // Only normal words cost a life if missed; distractors expire safely
            if (!item.isDistractor) {
              nextItems.push({ ...item, yPercent: 88, isMissed: true })
            }
          } else {
            nextItems.push({ ...item, yPercent: nextY })
          }
        }
        commitFallingItems(nextItems)
      }

      animFrameRef.current = requestAnimationFrame(loop)
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [commitFallingItems, config.maxSimultaneousWords, config.spawnIntervalMs, spawnWord])

  useEffect(() => {
    const missedIds = new Set(fallingItems.filter((item) => item.isMissed).map((item) => item.id))
    if (missedIds.size === 0) return

    commitFallingItems(fallingItemsRef.current.filter((item) => !missedIds.has(item.id)))
    playTone('miss')
    missedIds.forEach(() => onLifeLost())
  }, [commitFallingItems, fallingItems, onLifeLost])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputVal(val)

    const cleanVal = val.trim().toLowerCase()
    if (!cleanVal) return

    // Check match in active falling items
    const currentItems = fallingItemsRef.current
    const matchedIndex = currentItems.findIndex(
      (item) => !item.isMatched && !item.isMissed && item.word.toLowerCase() === cleanVal
    )

    if (matchedIndex !== -1) {
      const matched = currentItems[matchedIndex]

      if (matched.isDistractor) {
        // Player typed a trap word: penalize
        playTone('miss')
        setLastTrapWord(matched.word)
        setTrapWarning(true)
        setTimeout(() => setTrapWarning(false), 1500)
        onLifeLost()

        commitFallingItems(currentItems.map((item, idx) =>
          idx === matchedIndex ? { ...item, isMatched: true } : item
        ))
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

      commitFallingItems(currentItems.map((item, idx) =>
        idx === matchedIndex ? { ...item, isMatched: true } : item
      ))

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
    <WordRainPlayfield
      fallingItems={fallingItems}
      inputVal={inputVal}
      inputRef={inputRef}
      isPaused={isPaused}
      trapWarning={trapWarning}
      lastTrapWord={lastTrapWord}
      onInputChange={handleInputChange}
    />
  )
}
