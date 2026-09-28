'use client'

// Planned structure:
// <ChunkDuelSession>
//   {status === 'game_over' ? (
//     <ChunkDuelResults state={state} onRestart={startGame} />
//   ) : !isPlaying || !currentRound ? (
//     <GameIntroPanel copy={CHUNK_DUEL_INTRO} onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <ChunkGhostBar />
//       <ChunkDuelPrompt />
//       <ChunkTileTray />
//       {status === 'round_result' && <RoundResultBanner onNext={nextRound} />}
//     </GameContainer>
//   )}
// </ChunkDuelSession>

import { useChunkDuelLoop } from '@/hooks/games/useChunkDuelLoop'
import type { ChunkDuelItem } from '@/lib/games/chunk-duel/schema'
import GameIntroPanel from '@/components/practice/games/shared/GameIntroPanel'
import { CHUNK_DUEL_INTRO } from '@/components/practice/games/shared/game-intro-copy'
import ChunkGhostBar from './ChunkGhostBar'
import ChunkDuelPrompt from './ChunkDuelPrompt'
import ChunkTileTray from './ChunkTileTray'
import ChunkDuelResults from './ChunkDuelResults'

interface ChunkDuelSessionProps {
  pool: ChunkDuelItem[]
}

export default function ChunkDuelSession({ pool }: ChunkDuelSessionProps) {
  const { state, isPlaying, startGame, pickTile, nextRound } = useChunkDuelLoop(pool)

  if (state.status === 'game_over' || (state.roundIndex > 10 && state.status === 'round_result')) {
    return <ChunkDuelResults state={state} onRestart={startGame} />
  }

  if (!isPlaying || !state.currentRound) {
    return (
      <GameIntroPanel
        copy={CHUNK_DUEL_INTRO}
        onStart={startGame}
        unavailableReason={
          pool.length === 0
            ? 'No pudimos cargar los bloques de lenguaje. Recarga la página.'
            : undefined
        }
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4 py-4">
      <ChunkGhostBar
        ghostProgress={state.ghostProgress}
        roundIndex={state.roundIndex}
        totalRounds={state.totalRounds}
      />

      <ChunkDuelPrompt
        chunkItem={state.currentRound.chunkItem}
        selectedTileIds={state.selectedTileIds}
        tiles={state.currentRound.tiles}
      />

      <ChunkTileTray
        tiles={state.currentRound.tiles}
        selectedTileIds={state.selectedTileIds}
        shakeTileId={state.shakeTileId}
        onPick={pickTile}
      />

      {state.status === 'round_result' && (
        <div className="space-y-3 rounded-2xl border border-border bg-surface-card p-4 text-center animate-in fade-in">
          <div className="font-heading text-xl font-extrabold text-fg">
            {state.roundWon ? '¡Ganaste la ronda! ⚡' : '👻 Te ganó el fantasma esta vez'}
          </div>
          <div className="font-sans text-caption italic text-fg-muted">
            «{state.currentRound.chunkItem.example}»
          </div>
          <button
            type="button"
            onClick={nextRound}
            className="w-full rounded-2xl bg-ink py-3 font-sans text-body-sm font-bold text-surface-base transition-opacity hover:opacity-90 cursor-pointer"
          >
            Siguiente ronda ↵
          </button>
        </div>
      )}
    </div>
  )
}
