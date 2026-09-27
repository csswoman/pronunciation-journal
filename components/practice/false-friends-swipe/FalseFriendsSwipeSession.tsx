'use client'

// Planned structure:
// <FalseFriendsSwipeSession>
//   {status === 'completed' ? (
//     <SwipeResults state={state} onRestart={startGame} />
//   ) : status === 'rescue_round' ? (
//     <SwipeRescueRound miss={state.missHistory[state.rescueIndex]} rescueIndex={state.rescueIndex} totalRescues={state.missHistory.length} onAnswerRescue={answerRescue} />
//   ) : !isPlaying ? (
//     <StartSetupCard onStart={startGame} />
//   ) : (
//     <GameContainer>
//       <SwipeCardStack card={state.currentCard} cardTimeY={state.cardTimeY} currentIndex={state.currentIndex} totalCards={state.deck.length} onAnswer={answer} />
//       {status === 'showing_verdict' && lastVerdict && <SwipeVerdictLine card={lastVerdict.card} isCorrect={lastVerdict.isCorrect} onDismiss={dismissVerdict} />}
//     </GameContainer>
//   )}
// </FalseFriendsSwipeSession>

import { useFalseFriendsSwipeLoop } from '@/hooks/games/useFalseFriendsSwipeLoop'
import type { FalseFriend } from '@/lib/false-friends/types'
import SwipeCardStack from './SwipeCardStack'
import SwipeVerdictLine from './SwipeVerdictLine'
import SwipeRescueRound from './SwipeRescueRound'
import SwipeResults from './SwipeResults'
import PastelCard from '@/components/layout/PastelCard'

interface FalseFriendsSwipeSessionProps {
  entries: FalseFriend[]
}

export default function FalseFriendsSwipeSession({
  entries,
}: FalseFriendsSwipeSessionProps) {
  const {
    state,
    isPlaying,
    startGame,
    answer,
    dismissVerdict,
    answerRescue,
  } = useFalseFriendsSwipeLoop(entries)

  if (state.status === 'completed') {
    return <SwipeResults state={state} onRestart={startGame} />
  }

  if (state.status === 'rescue_round' && state.missHistory[state.rescueIndex]) {
    return (
      <div className="w-full max-w-lg mx-auto py-8">
        <SwipeRescueRound
          miss={state.missHistory[state.rescueIndex]!}
          rescueIndex={state.rescueIndex}
          totalRescues={state.missHistory.length}
          onAnswerRescue={answerRescue}
        />
      </div>
    )
  }

  if (!isPlaying || !state.currentCard) {
    return (
      <div className="w-full max-w-lg mx-auto py-8">
        <PastelCard tone="lilac" className="p-6 sm:p-8 rounded-3xl text-ink space-y-6">
          <div className="space-y-2 text-center">
            <span className="font-mono text-tiny font-bold uppercase tracking-wider text-ink/70">
              DESACTIVADOR DE TRAMPAS
            </span>
            <h1 className="font-heading text-3xl font-extrabold text-ink leading-tight">
              ¿Trampa? Falsos Amigos
            </h1>
            <p className="font-sans text-body-sm text-ink/80 text-pretty">
              Evalúa la palabra en pantalla. Decide rápido si la traducción mostrada es <strong>VERDAD</strong> o una <strong>TRAMPA</strong> de falso amigo.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-ink/5 border border-ink/10 space-y-2 text-body-sm font-sans text-ink/90">
            <div className="font-bold flex items-center gap-2">
              <span>⚡ Controles:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-caption text-ink/80">
              <li>Usa los botones o flechas del teclado <strong>[← Trampa]</strong> | <strong>[Verdad →]</strong>.</li>
              <li>Tienes 5 segundos por palabra.</li>
              <li>Al final, las palabras falladas pasarán a la <strong>Ronda de Rescate</strong> en contexto.</li>
            </ul>
          </div>

          <button
            type="button"
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-ink text-surface-base font-sans text-body font-bold hover:opacity-95 transition-opacity text-center shadow-md cursor-pointer"
          >
            Iniciar Desafío 🛡️
          </button>
        </PastelCard>
      </div>
    )
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 py-4">
      <SwipeCardStack
        card={state.currentCard}
        cardTimeY={state.cardTimeY}
        currentIndex={state.currentIndex}
        totalCards={state.deck.length}
        onAnswer={answer}
      />

      {state.status === 'showing_verdict' && state.lastVerdict && (
        <SwipeVerdictLine
          card={state.lastVerdict.card}
          isCorrect={state.lastVerdict.isCorrect}
          onDismiss={dismissVerdict}
        />
      )}
    </div>
  )
}
