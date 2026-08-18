'use client'

import React, { useState, useEffect, useRef } from 'react'
import type {
  CellCoordinate,
  WordSearchItem,
  WordSearchPuzzle,
} from '@/lib/exercises/word-search/types'
import { checkWordMatch } from '@/lib/exercises/word-search/grid-generator'
import { playUiCue } from '@/lib/ui-sounds/cues'
import WordSearchSetup from './WordSearchSetup'
import WordSearchGrid from './WordSearchGrid'
import WordClueList from './WordClueList'
import WordFoundBanner from './WordFoundBanner'
import Button from '@/components/ui/Button'
import { PillButton } from '@/components/ui/PillButton'
import {
  RotateCcw,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Timer as TimerIcon,
} from '@/components/icons'
import Link from 'next/link'

export default function WordSearchSession() {
  const [puzzle, setPuzzle] = useState<WordSearchPuzzle | null>(null)
  const [foundWordIds, setFoundWordIds] = useState<Set<string>>(new Set())
  const [activeWordId, setActiveWordId] = useState<string | null>(null)
  const [lastFoundItem, setLastFoundItem] = useState<WordSearchItem | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Start timer on puzzle load
  useEffect(() => {
    if (!puzzle || isCompleted) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    setElapsedSeconds(0)
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [puzzle, isCompleted])

  const handleStartPuzzle = (newPuzzle: WordSearchPuzzle) => {
    setPuzzle(newPuzzle)
    setFoundWordIds(new Set())
    setActiveWordId(null)
    setLastFoundItem(null)
    setIsCompleted(false)
  }

  const handleSelectPath = (path: CellCoordinate[]) => {
    if (!puzzle || isCompleted) return

    const matchedWordId = checkWordMatch(path, puzzle.placements)
    if (matchedWordId && !foundWordIds.has(matchedWordId)) {
      const item = puzzle.items.find((i) => i.id === matchedWordId)
      if (!item) return

      playUiCue('correct')

      const updatedSet = new Set(foundWordIds)
      updatedSet.add(matchedWordId)
      setFoundWordIds(updatedSet)
      setLastFoundItem(item)
      setActiveWordId(matchedWordId)

      // Check if all words have been found
      if (updatedSet.size === puzzle.items.length) {
        setIsCompleted(true)
        if (timerRef.current) clearInterval(timerRef.current)
      }
    }
  }

  const handleResetSession = () => {
    setPuzzle(null)
    setFoundWordIds(new Set())
    setActiveWordId(null)
    setLastFoundItem(null)
    setIsCompleted(false)
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // If no puzzle is active, show the setup configuration
  if (!puzzle) {
    return (
      <div className="flex flex-col gap-6 w-full">
        <div className="flex items-center gap-2">
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-xs text-fg-muted hover:text-fg transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Práctica</span>
          </Link>
        </div>
        <WordSearchSetup onStartPuzzle={handleStartPuzzle} />
      </div>
    )
  }

  const itemsWithFoundState: WordSearchItem[] = puzzle.items.map((item) => ({
    ...item,
    found: foundWordIds.has(item.id),
  }))

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Session header bar */}
      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-raised border border-border-subtle">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleResetSession}
            className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-surface-sunken transition-colors cursor-pointer"
            title="Elegir otro tema"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-fg truncate">
                {puzzle.title}
              </h3>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-sunken text-fg-muted border border-border-subtle shrink-0">
                {puzzle.mode === 'classic' ? 'Clásica' : 'Pistas'}
              </span>
            </div>
            <span className="text-xs text-fg-muted truncate">
              {puzzle.topic}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs font-mono text-fg-muted bg-surface-sunken px-2.5 py-1 rounded-lg border border-border-subtle">
            <TimerIcon className="w-3.5 h-3.5" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>
          <PillButton
            variant="outline"
            size="sm"
            onClick={() => handleStartPuzzle(puzzle)}
            title="Reiniciar esta sopa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </PillButton>
        </div>
      </div>

      {/* Word found banner */}
      <WordFoundBanner
        item={lastFoundItem}
        onDismiss={() => setLastFoundItem(null)}
      />

      {/* Completion celebration card */}
      {isCompleted ? (
        <div className="flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl bg-surface-raised border border-success/30 shadow-sm gap-5 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-success text-on-primary flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-lg font-bold text-fg">
              ¡Completaste la búsqueda!
            </h3>
            <p className="text-xs text-fg-muted max-w-md leading-relaxed">
              Has descubierto las {puzzle.items.length} palabras del tema &ldquo;{puzzle.title}&rdquo; en un tiempo de <span className="font-semibold text-fg">{formatTime(elapsedSeconds)}</span>.
            </p>
          </div>

          {/* Words recap */}
          <div className="flex flex-wrap justify-center gap-2 max-w-lg p-3 rounded-xl bg-surface-sunken border border-border-subtle">
            {puzzle.items.map((item) => (
              <span
                key={item.id}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-raised border border-border-subtle text-fg"
              >
                {item.displayWord}{' '}
                {item.ipa && (
                  <span className="font-ipa text-fg-muted text-[11px]">
                    {item.ipa}
                  </span>
                )}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button variant="primary" onClick={handleResetSession}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              <span>Jugar otro tema</span>
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleStartPuzzle(puzzle)}
            >
              <RotateCcw className="w-4 h-4 mr-1.5" />
              <span>Repetir este tablero</span>
            </Button>
          </div>
        </div>
      ) : (
        /* Main game board + clues area */
        <div className="grid w-full items-start gap-layout-section-gap lg:grid-cols-[minmax(0,1.25fr)_minmax(17rem,0.75fr)]">
          <div className="flex w-full justify-center">
            <WordSearchGrid
              grid={puzzle.grid}
              placements={puzzle.placements}
              foundWordIds={foundWordIds}
              activeWordId={activeWordId}
              onSelectPath={handleSelectPath}
            />
          </div>

          <div className="w-full">
            <WordClueList
              items={itemsWithFoundState}
              mode={puzzle.mode}
              activeWordId={activeWordId}
              onInspectWord={setActiveWordId}
            />
          </div>
        </div>
      )}
    </div>
  )
}
