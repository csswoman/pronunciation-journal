'use client'

// Planned structure:
// <PracticeGamesHubClient>
//   <HeaderRow title="Juegos" kicker="PRÁCTICA RÁPIDA" statsChips />
//   <MainLayoutGrid>
//     <GamesSidebar games={PRACTICE_GAMES} selected={selectedGameId} onSelect={...} />
//     <SelectedGameContainer>
//       <GameBannerCard game={selectedGame} />
//       {selectedGameId === 'word-search' && <WordSearchSetup onStartPuzzle={...} />}
//       {selectedGameId === 'word-rain' && <WordRainSetupForm />}
//       {otherGames && <GameDirectLaunchCard game={selectedGame} />}
//     </SelectedGameContainer>
//   </MainLayoutGrid>
// </PracticeGamesHubClient>

import { useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/layout/PageLayout'
import { PRACTICE_GAMES } from '@/lib/practice/practice-games'
import type { WordSearchPuzzle } from '@/lib/exercises/word-search/types'
import WordSearchSetup from '@/components/practice/word-search/WordSearchSetup'
import WordSearchSession from '@/components/practice/word-search/WordSearchSession'
import GamesSidebar from './GamesSidebar'
import GameBannerCard from './GameBannerCard'
import WordRainSetupForm from './WordRainSetupForm'

export default function PracticeGamesHubClient() {
  const [selectedGameId, setSelectedGameId] = useState<string>('word-search')
  const [activeSearchPuzzle, setActiveSearchPuzzle] = useState<WordSearchPuzzle | null>(null)

  const selectedGame =
    PRACTICE_GAMES.find((g) => g.id === selectedGameId) ?? PRACTICE_GAMES[0]

  if (activeSearchPuzzle) {
    return (
      <PageLayout archetype="catalog" className="pt-2 sm:pt-4 pb-10">
        <WordSearchSession
          initialPuzzle={activeSearchPuzzle}
          onExit={() => setActiveSearchPuzzle(null)}
        />
      </PageLayout>
    )
  }

  return (
    <PageLayout archetype="catalog" className="flex flex-col gap-6">
      {/* Top Header matching Juegos.dc.html */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-tiny font-bold uppercase tracking-wider text-fg-muted">
            PRÁCTICA RÁPIDA
          </span>
          <h1 className="font-heading text-4xl sm:text-[46px] font-extrabold text-fg leading-tight">
            Juegos
          </h1>
          <p className="font-sans text-body-md text-fg-muted">
            Mecánicas cortas para ganar reflejos con el vocabulario que ya tienes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full border border-border-subtle bg-surface-sunken px-3.5 py-1 font-sans text-caption font-bold text-fg-muted">
            7 disponibles
          </span>
          <span className="inline-flex items-center rounded-full bg-[#a8e6c9] dark:bg-[#1f5e43] dark:text-[#a8e6c9] px-3.5 py-1 font-sans text-caption font-bold text-[#12151c]">
            38 palabras ganadas jugando
          </span>
        </div>
      </header>

      {/* Main 2-column layout matching Juegos.dc.html */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-6 items-start">
        {/* Left Sidebar */}
        <GamesSidebar
          games={PRACTICE_GAMES}
          selectedGameId={selectedGameId}
          onSelectGame={(id) => {
            setSelectedGameId(id)
            setActiveSearchPuzzle(null)
          }}
          bestScoreLabel="8 de 8 · 3:12"
        />

        {/* Selected Game Main Content */}
        <div className="flex flex-col gap-5 min-w-0">
          <GameBannerCard game={selectedGame} />

          {selectedGameId === 'word-search' && (
            <div className="rounded-3xl border border-border-default bg-surface-raised p-5 sm:p-6 shadow-xs">
              <WordSearchSetup onStartPuzzle={(puzzle) => setActiveSearchPuzzle(puzzle)} />
            </div>
          )}

          {selectedGameId === 'word-rain' && <WordRainSetupForm />}

          {selectedGameId !== 'word-search' && selectedGameId !== 'word-rain' && (
            <div className="rounded-3xl border border-border-default bg-surface-raised p-6 shadow-xs space-y-4 text-center">
              <h3 className="font-heading text-xl font-extrabold text-fg">
                {selectedGame.title}
              </h3>
              <p className="font-sans text-body-sm text-fg-muted max-w-md mx-auto">
                {selectedGame.description}
              </p>
              <Link
                href={selectedGame.href}
                className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-90 transition-opacity shadow-sm"
              >
                Entrar a jugar 🚀
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}
