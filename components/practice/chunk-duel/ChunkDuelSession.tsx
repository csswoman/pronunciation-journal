'use client'

// Planned structure:
// <ChunkDuelSession>
//   {status === 'game_over' ? (
//     <ChunkDuelResults state={state} onRestart={startGame} />
//   ) : !isPlaying ? (
//     <StartSetupCard onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <ChunkGhostBar />
//       <ChunkDuelPrompt />
//       <ChunkTileTray />
//       {roundWon !== null && <RoundResultBanner onNext={nextRound} />}
//     </GameContainer>
//   )}
// </ChunkDuelSession>

import { useChunkDuelLoop } from '@/hooks/games/useChunkDuelLoop'
import type { ChunkDuelItem } from '@/lib/games/chunk-duel/schema'
import ChunkGhostBar from './ChunkGhostBar'
import ChunkDuelPrompt from './ChunkDuelPrompt'
import ChunkTileTray from './ChunkTileTray'
import ChunkDuelResults from './ChunkDuelResults'
import PastelCard from '@/components/layout/PastelCard'

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
      <div className="w-full max-w-lg mx-auto py-8">
        <PastelCard tone="butter" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
          <div className="space-y-2 text-center">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
              COLOCACIONES Y ESTRUCTURAS
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-ink leading-tight">
              Chunk Duel
            </h1>
            <p className="font-sans text-body-sm text-ink/80 text-pretty">
              Arma bloques frecuentes en inglés ordenando sus piezas antes de que el <strong>rival fantasma</strong> complete su barra.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ink/5 border border-ink/10 space-y-2 text-body-sm font-sans text-ink/90">
            <div className="font-bold flex items-center gap-2">
              <span>⚔️ Mecánica de duelo:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-caption text-ink/80">
              <li>10 rondas de velocidad por partida.</li>
              <li>Toca las fichas de palabras en el orden correcto.</li>
              <li>Si te equivocas de ficha se agitará con penalización leve.</li>
              <li>¡Escucha el audio nativo de cada bloque al completar la ronda!</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-95 transition-opacity text-center shadow-md cursor-pointer"
          >
            Entrar al Duelo ⚔️
          </button>
        </PastelCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 py-4">
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
        <div className="p-4 rounded-2xl bg-surface-card border border-border text-center space-y-3 animate-in fade-in">
          <div className="font-heading text-xl font-extrabold text-fg">
            {state.roundWon ? '¡Ganaste la ronda! ⚡' : '👻 Te ganó el fantasma esta vez'}
          </div>
          <div className="font-sans text-caption text-fg-muted italic">
            «{state.currentRound.chunkItem.example}»
          </div>
          <button
            type="button"
            onClick={nextRound}
            className="w-full py-3 rounded-2xl bg-ink text-surface-base font-sans text-body-sm font-bold hover:opacity-90 transition-opacity"
          >
            Siguiente ronda ↵
          </button>
        </div>
      )}
    </div>
  )
}
